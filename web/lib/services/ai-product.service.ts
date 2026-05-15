/**
 * AI Product Photography Service
 * Orchestrates:
 *  1. Background removal (Cloudinary AI background removal transformation)
 *  2. Styled image generation (Replicate Stable Diffusion XL or IDM-VTON)
 *  3. Upload final result back to Cloudinary
 *  4. Update MongoDB Product document
 */

import { v2 as cloudinary } from 'cloudinary';
import Replicate from 'replicate';
import sharp from 'sharp';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import AiStyle from '@/models/AiStyle';
import { analyzeProductImage } from '@/lib/services/ai-photography/product-understanding.service';
import { buildScenePrompt } from '@/lib/services/ai-photography/prompt-engine.service';
import { buildCompositionPlan, prepareProductLayer } from '@/lib/services/ai-photography/composition.engine';
import { generateShadowLayer } from '@/lib/services/ai-photography/shadow.service';
import { relightProductImage } from '@/lib/services/ai-photography/relighting.service';
import { getCachedBackground, setCachedBackground } from '@/lib/services/ai-photography/background-cache.service';
import type { AiPhotographyMetadata, CompositionPlan, GenerationQuality, ProductUnderstanding, ScenePrompt } from '@/lib/services/ai-photography/types';

// ── Cloudinary setup ──────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ── Replicate setup ───────────────────────────────────────────────
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
export type EnhanceMode = 'style' | 'custom-scene';

export interface EnhanceRequest {
  productId: string;
  imageUrl: string;          // Cloudinary URL of the raw product image
  mode: EnhanceMode;
  styleId?: string;           // if mode === 'style'
  customSceneUrl?: string;    // if mode === 'custom-scene' (Cloudinary URL)
  productName?: string;       // used to personalise the prompt
  vendorModelReferenceUrl?: string;
  generationQuality?: GenerationQuality;
  vendorPreferences?: string;
  lightingType?: string;
}

export interface EnhanceResult {
  aiGalleryEntryId: string;
  predictionId: string;
}

// ─────────────────────────────────────────────────────────────────
// Helper: fetch a URL and return a Buffer
// ─────────────────────────────────────────────────────────────────
async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// ─────────────────────────────────────────────────────────────────
// Step 1 — Upload product to Cloudinary for permanent URL
// ─────────────────────────────────────────────────────────────────
async function uploadProductImage(imageUrl: string): Promise<string> {
  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload(
      imageUrl,
      { folder: 'Offerbuddy/ai-temp', resource_type: 'image' },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
  });
  console.log(`[AI] Product uploaded: ${result.secure_url}`);
  return result.secure_url as string;
}

// ─────────────────────────────────────────────────────────────────
// Retry wrapper for Replicate API calls that may hit 429 rate limits.
// Replicate allows 6 req/min with <$5 credit; retries with backoff.
// ─────────────────────────────────────────────────────────────────
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRateLimit = err?.response?.status === 429 || err?.status === 429 ||
        (err?.message && err.message.includes('429'));
      if (isRateLimit && attempt < maxRetries) {
        const delay = (attempt + 1) * 8000; // 8s, 16s, 24s, 32s
        console.warn(`[AI] Rate limited (429). Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

// ─────────────────────────────────────────────────────────────────
// Step 1b — Background removal via Replicate (851-labs/background-removal)
// Returns a transparent PNG URL. Much cheaper than Cloudinary add-on.
// This runs SYNCHRONOUSLY (polls until done) before background generation.
// ─────────────────────────────────────────────────────────────────
async function removeBackgroundLocal(imageUrl: string): Promise<Buffer> {
  const { removeBackground } = await import('@imgly/background-removal-node');
  console.log(`[AI] Removing background locally (ONNX)...`);

  // @imgly/background-removal-node doesn't support AVIF.
  // Download the image, convert to PNG via sharp (handles all formats), then pass as a Blob.
  const rawBuffer = await fetchBuffer(imageUrl);
  const pngBuffer = await sharp(rawBuffer).png().toBuffer();
  const pngBlob = new Blob([new Uint8Array(pngBuffer)], { type: 'image/png' });

  const resultBlob = await removeBackground(pngBlob);
  const buffer = Buffer.from(await resultBlob.arrayBuffer());
  console.log(`[AI] Background removed, transparent PNG ready.`);
  return buffer;
}

// ─────────────────────────────────────────────────────────────────
// Step 2a — Style-based Enhancement
// Uses Flux Dev (official Replicate deployment, supports img2img)
// ─────────────────────────────────────────────────────────────────
// Helper: extract Cloudinary public_id from a secure URL
// e.g. https://res.cloudinary.com/cloud/image/upload/v123/folder/file.jpg → folder/file
// ─────────────────────────────────────────────────────────────────
function extractPublicId(cloudinaryUrl: string): string {
  const match = cloudinaryUrl.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?(\?.*)?$/);
  return match ? match[1] : '';
}

// ─────────────────────────────────────────────────────────────────
// Step 2a — Generate a styled BACKGROUND with flux-schnell
// (~$0.003/run vs $0.055 for flux-dev — 18x cheaper)
// flux-schnell is text-to-image only: we generate the SCENE/BACKGROUND
// and then composite the product on top using Cloudinary (Step 2b).
// This guarantees 100% product preservation — the product image is never
// passed to any AI model, so it cannot be replaced or distorted.
// ─────────────────────────────────────────────────────────────────
async function generateBackgroundAsync(scenePrompt: ScenePrompt): Promise<string> {
  const isPremium = scenePrompt.quality === 'premium';
  const model = isPremium
    ? (process.env.REPLICATE_PREMIUM_MODEL || 'black-forest-labs/flux-dev')
    : (process.env.REPLICATE_PREVIEW_MODEL || 'black-forest-labs/flux-schnell');

  // IMPORTANT: Flux Schnell (preview) does NOT support negative_prompt.
  // It is a 4-step distilled model that silently ignores negative_prompt.
  // Product suppression for Schnell is handled entirely inside the affirmative prompt.
  // Flux Dev (premium) supports negative_prompt; use it as secondary reinforcement.
  const input: Record<string, unknown> = {
    prompt: scenePrompt.prompt,
    num_outputs: 1,
    aspect_ratio: '1:1',
    output_format: 'webp',
    output_quality: isPremium ? 95 : 90,
    go_fast: false, // always off: faster inference degrades instruction-following
  };

  if (isPremium && scenePrompt.negativePrompt) {
    input.negative_prompt = scenePrompt.negativePrompt;
    input.guidance = 3.5; // Flux Dev: increase prompt adherence
    input.num_inference_steps = 28;
  } else {
    // Flux Schnell: 4 steps default — leave num_inference_steps unset
    input.num_inference_steps = 4;
  }

  console.log(`[AI] Background generation — model: ${model.split('/').pop()}, quality: ${scenePrompt.quality}`);
  console.log(`[AI] Prompt (first 200 chars): ${scenePrompt.prompt.slice(0, 200)}`);

  const prediction = await retryWithBackoff(() =>
    replicate.predictions.create({ model, input })
  );

  return prediction.id;
}

// ─────────────────────────────────────────────────────────────────
// Step 2b — Composite product onto background using sharp (local, no add-ons).
// Downloads both images as buffers, resizes the product to 80% of the
// background, and overlays it centered. No Cloudinary paid add-ons needed.
// ─────────────────────────────────────────────────────────────────
async function compositeProductOnBackground(
  cutoutProduct: string | Buffer,   // transparent PNG: URL or Buffer from local bg-removal
  backgroundImageUrl: string,
  vendorId: string,
  metadata?: Pick<AiPhotographyMetadata, 'lightingProfile' | 'composition' | 'productUnderstanding'>
): Promise<string> {
  const CANVAS = 1024;
  const fallbackUnderstanding: ProductUnderstanding = {
    category: 'generic',
    subcategory: 'product',
    material: 'unknown',
    orientation: 'square',
    dominantColor: '#808080',
    style: 'marketplace commercial',
    sceneType: 'clean premium studio',
    composition: 'centered product hero',
    confidence: 0.3,
    source: 'heuristic',
  };
  const understanding = metadata?.productUnderstanding || fallbackUnderstanding;
  const plan = metadata?.composition || buildCompositionPlan({
    category: understanding.category,
    orientation: understanding.orientation,
    canvasSize: CANVAS,
  });
  const lightingProfile = metadata?.lightingProfile || {
    name: 'balanced ecommerce studio',
    direction: 'front' as const,
    temperature: 'neutral' as const,
    brightness: 1.04,
    contrast: 1.05,
    shadowOpacity: 0.25,
    shadowBlur: 30,
  };

  console.log(`[AI] Downloading images for compositing...`);
  const [bgBuffer, productBuffer] = await Promise.all([
    fetchBuffer(backgroundImageUrl),
    // Accept either a Buffer (from local bg-removal) or a URL string
    typeof cutoutProduct === 'string' ? fetchBuffer(cutoutProduct) : Promise.resolve(cutoutProduct),
  ]);

  // Resize background — JPEG ensures no alpha channel
  const bgResized = await sharp(bgBuffer)
    .resize(CANVAS, CANVAS, { fit: 'cover' })
    .removeAlpha()
    .jpeg({ quality: 95 })
    .toBuffer();

  // Resize product — keep alpha (transparency)
  const relitProduct = await relightProductImage({
    productBuffer,
    lighting: lightingProfile,
    understanding,
  });
  const productLayer = await prepareProductLayer(relitProduct, plan as CompositionPlan);
  const shadowLayer = await generateShadowLayer({
    productLayer: productLayer.buffer,
    productWidth: productLayer.width,
    productHeight: productLayer.height,
    productLeft: productLayer.left,
    productTop: productLayer.top,
    plan,
    lighting: lightingProfile,
  });

  // Composite and force fully opaque output (no checkerboard in browsers)
  const compositeBuffer = await sharp(bgResized)
    .composite([
      { input: shadowLayer.input, left: shadowLayer.left, top: shadowLayer.top, blend: 'over' },
      { input: productLayer.buffer, left: productLayer.left, top: productLayer.top, blend: 'over' },
    ])
    .removeAlpha()
    .webp({ quality: 92 })
    .toBuffer();

  console.log(`[AI] Compositing complete (${CANVAS}x${CANVAS}). Uploading to Cloudinary...`);

  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `Offerbuddy/vendors/${vendorId}/ai-enhanced`, resource_type: 'image', format: 'webp' },
      (err, res) => { if (err) reject(err); else resolve(res); }
    ).end(compositeBuffer);
  });

  console.log(`[AI] Final image uploaded: ${result.secure_url}`);
  return result.secure_url as string;
}

// ─────────────────────────────────────────────────────────────────
// Step 2c — Custom scene: composite product onto vendor-uploaded scene
// ─────────────────────────────────────────────────────────────────
async function compositeWithCustomSceneAsync(
  cutoutProduct: string | Buffer,
  customSceneUrl: string,
  vendorId: string,
  metadata?: Pick<AiPhotographyMetadata, 'lightingProfile' | 'composition' | 'productUnderstanding'>
): Promise<string> {
  return compositeProductOnBackground(cutoutProduct, customSceneUrl, vendorId, metadata);
}

// ─────────────────────────────────────────────────────────────────
// Step 3 — Upload final image to Cloudinary
// ─────────────────────────────────────────────────────────────────
async function uploadFinalImage(
  replicateOutputUrl: string,
  vendorId: string
): Promise<string> {
  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload(
      replicateOutputUrl,
      {
        folder: `Offerbuddy/vendors/${vendorId}/ai-enhanced`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
  return result.secure_url as string;
}

// ─────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────
export async function enhanceProductImage(
  request: EnhanceRequest,
  vendorId: string
): Promise<{ aiGalleryEntryId?: string; predictionId: string; enhancedUrl?: string }> {

  const {
    productId,
    imageUrl,
    mode,
    styleId,
    customSceneUrl,
    productName,
    vendorModelReferenceUrl,
    generationQuality = 'preview',
    vendorPreferences,
    lightingType,
  } = request;
  const isPreview = !productId || productId === 'preview';

  // Step 1: Upload original product to Cloudinary for permanent URL
  console.log(`[AI] Uploading product image...`);
  const uploadedProductUrl = await uploadProductImage(imageUrl);
  const originalBuffer = await fetchBuffer(uploadedProductUrl);
  const productUnderstanding = await analyzeProductImage({
    imageBuffer: originalBuffer,
    imageUrl: uploadedProductUrl,
    productName,
  });
  console.log(`[AI] Product understood as ${productUnderstanding.category}/${productUnderstanding.subcategory} (${productUnderstanding.source}).`);

  // Step 1b: Remove background LOCALLY using ONNX model — no external API
  let cutoutProduct: string | Buffer = uploadedProductUrl; // fallback = original URL
  try {
    cutoutProduct = await removeBackgroundLocal(uploadedProductUrl);
  } catch (err) {
    console.warn('[AI] Local BG removal failed, using original image:', err);
  }

  await connectDB();
  const style = styleId ? await AiStyle.findById(styleId) : await AiStyle.findOne({
    isActive: true,
    $or: [
      { categoryCompatibility: productUnderstanding.category },
      { categoryCompatibility: { $size: 0 } },
      { categoryCompatibility: { $exists: false } },
    ],
  }).sort({ createdAt: 1 });

  const scenePrompt = buildScenePrompt({
    productName,
    understanding: productUnderstanding,
    style,
    quality: generationQuality,
    vendorPreferences,
    lightingType,
  });
  const composition = buildCompositionPlan({
    category: productUnderstanding.category,
    orientation: productUnderstanding.orientation,
    styleRules: style?.compositionRules as any,
  });
  const aiMetadata: AiPhotographyMetadata = {
    category: productUnderstanding.category,
    subcategory: productUnderstanding.subcategory,
    material: productUnderstanding.material,
    orientation: productUnderstanding.orientation,
    dominantColor: productUnderstanding.dominantColor,
    sceneType: scenePrompt.sceneType,
    lightingProfile: scenePrompt.lightingProfile,
    composition,
    prompt: scenePrompt.prompt,
    negativePrompt: scenePrompt.negativePrompt,
    generationQuality,
    productUnderstanding,
    vendorModelReference: vendorModelReferenceUrl || null,
    workflow: vendorModelReferenceUrl
      ? 'virtual-try-on-reference'
      : mode === 'custom-scene'
        ? 'custom-scene-composite'
        : 'product-scene-composite',
  };

  // Step 2: Generate background with flux-schnell OR composite for custom-scene
  let predictionId: string;

  if (mode === 'custom-scene') {
    const sceneUrl = customSceneUrl || vendorModelReferenceUrl;
    if (!sceneUrl) throw new Error('customSceneUrl is required for custom-scene mode');
    console.log(`[AI] Compositing product on custom scene...`);
    const enhancedUrl = await compositeWithCustomSceneAsync(cutoutProduct, sceneUrl, vendorId, {
      lightingProfile: aiMetadata.lightingProfile,
      composition: aiMetadata.composition,
      productUnderstanding,
    });
    if (isPreview) return { predictionId: 'cloudinary-composite', enhancedUrl };
    const prod = await Product.findById(productId);
    if (!prod) throw new Error('Product not found');
    const entry = {
      originalUrl: uploadedProductUrl,
      enhancedUrl,
      status: 'done',
      predictionId: 'cloudinary-composite',
      styleId: style?._id || null,
      customBackgroundUrl: sceneUrl,
      metadata: aiMetadata,
      category: productUnderstanding.category,
      sceneType: aiMetadata.sceneType,
      lightingProfile: aiMetadata.lightingProfile,
      vendorModelReference: vendorModelReferenceUrl || null,
      createdAt: new Date(),
    };
    prod.aiGallery = [...(prod.aiGallery || []), entry as any];
    await prod.save();
    return { aiGalleryEntryId: String((prod.aiGallery as any[]).length - 1), predictionId: 'cloudinary-composite', enhancedUrl };
  } else {
    if (styleId && !style) throw new Error('AI Style not found');
    const cachedBackgroundUrl = getCachedBackground(scenePrompt.cacheKey);
    if (cachedBackgroundUrl && isPreview) {
      const enhancedUrl = await compositeProductOnBackground(cutoutProduct, cachedBackgroundUrl, vendorId, {
        lightingProfile: aiMetadata.lightingProfile,
        composition: aiMetadata.composition,
        productUnderstanding,
      });
      return { predictionId: 'cached-background', enhancedUrl };
    }
    console.log(`[AI] Generating ${generationQuality} background for style "${scenePrompt.styleName}"...`);
    predictionId = await generateBackgroundAsync(scenePrompt);
  }

  // Preview mode: poll Replicate synchronously, then composite and return URL
  if (isPreview) {
    console.log(`[AI] Preview mode — polling for result...`);
    const enhancedUrl = await pollUntilDone(predictionId, cutoutProduct, vendorId, aiMetadata, scenePrompt.cacheKey);
    return { predictionId, enhancedUrl };
  }

  // Real product: save pending entry in aiGallery
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const pendingEntry = {
    originalUrl: uploadedProductUrl,
    // Buffers can't be stored in MongoDB; checkEnhancementStatus re-runs bg removal from originalUrl
    enhancedUrl: '',
    styleId: styleId || null,
    customBackgroundUrl: customSceneUrl || null,
    status: 'processing' as const,
    predictionId,
    metadata: aiMetadata,
    category: productUnderstanding.category,
    sceneType: aiMetadata.sceneType,
    lightingProfile: aiMetadata.lightingProfile,
    vendorModelReference: vendorModelReferenceUrl || null,
    createdAt: new Date(),
  };
  product.aiGallery = product.aiGallery || [];
  product.aiGallery.push(pendingEntry as any);
  await product.save();

  const entryId = (product.aiGallery[product.aiGallery.length - 1] as any)._id.toString();
  console.log(`[AI] Enhancement started for product ${productId}. Prediction: ${predictionId}`);
  return { aiGalleryEntryId: entryId, predictionId };
}

// ─────────────────────────────────────────────────────────────────
// Helper: extract URL from Replicate output
// Handles: plain string, string[], FileOutput (newer SDK = { url: () => string })
// ─────────────────────────────────────────────────────────────────
function extractReplicateUrl(output: unknown): string {
  if (!output) throw new Error('Replicate returned empty output');
  const item = Array.isArray(output) ? output[0] : output;
  // FileOutput in newer Replicate SDK versions has a .url() method
  if (item && typeof (item as any).url === 'function') return (item as any).url();
  if (typeof item === 'string') return item;
  throw new Error(`Unexpected Replicate output format: ${JSON.stringify(item)}`);
}

// ─────────────────────────────────────────────────────────────────
// Poll Replicate until background generation done, then composite product on top
// ─────────────────────────────────────────────────────────────────
async function pollUntilDone(
  predictionId: string,
  cutoutProduct: string | Buffer,
  vendorId: string,
  metadata?: AiPhotographyMetadata,
  backgroundCacheKey?: string,
  maxAttempts = 40
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const prediction = await replicate.predictions.get(predictionId);
    if (prediction.status === 'succeeded') {
      const backgroundUrl = extractReplicateUrl(prediction.output);
      if (backgroundCacheKey) setCachedBackground(backgroundCacheKey, backgroundUrl);
      console.log(`[AI] Background generated: ${backgroundUrl}`);
      return await compositeProductOnBackground(cutoutProduct, backgroundUrl, vendorId, metadata ? {
        lightingProfile: metadata.lightingProfile,
        composition: metadata.composition,
        productUnderstanding: metadata.productUnderstanding,
      } : undefined);
    }
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Replicate prediction ${prediction.status}`);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('AI processing timed out');
}

// ─────────────────────────────────────────────────────────────────
// Polling Status Checker
// ─────────────────────────────────────────────────────────────────
export async function checkEnhancementStatus(
  productId: string,
  entryId: string,
  vendorId: string
): Promise<{ status: string; enhancedUrl?: string }> {
  await connectDB();

  const product = await Product.findById(productId);
  if (!product || !product.aiGallery) throw new Error('Product or gallery not found');

  const entry = product.aiGallery.find((e: any) => e._id.toString() === entryId);
  if (!entry) throw new Error('AI gallery entry not found');

  if (entry.status === 'done' || entry.status === 'failed') {
    return { status: entry.status, enhancedUrl: entry.enhancedUrl };
  }

  if (!entry.predictionId) throw new Error('No prediction ID associated with this entry');

  const prediction = await replicate.predictions.get(entry.predictionId);

  if (prediction.status === 'succeeded') {
    console.log(`[AI] Background prediction ${entry.predictionId} succeeded.`);
    try {
      const backgroundUrl = extractReplicateUrl(prediction.output);
      console.log(`[AI] Background URL: ${backgroundUrl}`);
      // Run local BG removal on the stored product URL before compositing
      let cutoutProduct: string | Buffer = entry.originalUrl;
      try {
        cutoutProduct = await removeBackgroundLocal(entry.originalUrl);
      } catch {
        console.warn('[AI] BG removal in status checker failed, using original.');
      }
      const entryMetadata = entry.metadata as AiPhotographyMetadata | undefined;
      const cloudUrl = await compositeProductOnBackground(cutoutProduct, backgroundUrl, vendorId, entryMetadata ? {
        lightingProfile: entryMetadata.lightingProfile,
        composition: entryMetadata.composition,
        productUnderstanding: entryMetadata.productUnderstanding,
      } : undefined);
      entry.status = 'done';
      entry.enhancedUrl = cloudUrl;
      await product.save();
      return { status: 'done', enhancedUrl: cloudUrl };
    } catch (err) {
      console.error('[AI] Composite/upload failed:', err);
      entry.status = 'failed';
      await product.save();
      return { status: 'failed' };
    }
  } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
    entry.status = 'failed';
    await product.save();
    return { status: 'failed' };
  }

  return { status: 'processing' };
}

// ─────────────────────────────────────────────────────────────────
// Promote an AI-enhanced image as the primary product image
// ─────────────────────────────────────────────────────────────────
export async function promoteAiImage(
  productId: string,
  enhancedUrl: string
): Promise<void> {
  await connectDB();
  await Product.findByIdAndUpdate(productId, {
    $addToSet: { images: enhancedUrl },
  });
}
