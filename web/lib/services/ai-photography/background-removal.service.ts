/**
 * Product background removal — local ONNX (dev) or Replicate (production/serverless).
 * Local @imgly/background-removal-node often fails on Vercel (memory, cold start, timeouts).
 */

import { v2 as cloudinary } from 'cloudinary';
import Replicate from 'replicate';
import sharp from 'sharp';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const REPLICATE_BG_MODELS = process.env.REPLICATE_BG_MODELS
  ? process.env.REPLICATE_BG_MODELS.split(',').map((model) => model.trim()).filter(Boolean)
  : [
      process.env.REPLICATE_BG_MODEL ||
      'lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1',
      '851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc',
    ];

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

function resolveBgRemovalProvider(): 'local' | 'replicate' | 'cloudinary' {
  const explicit = process.env.AI_BG_REMOVAL?.toLowerCase();
  if (explicit === 'replicate') return 'replicate';
  if (explicit === 'local') return 'local';
  if (explicit === 'cloudinary') return 'cloudinary';
  if (process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return 'replicate';
  }
  return 'local';
}

async function removeBackgroundLocal(imageUrl: string): Promise<Buffer> {
  const { removeBackground } = await import('@imgly/background-removal-node');
  const rawBuffer = await fetchBuffer(imageUrl);
  const pngBuffer = await sharp(rawBuffer).png().toBuffer();
  const pngBlob = new Blob([new Uint8Array(pngBuffer)], { type: 'image/png' });
  const resultBlob = await removeBackground(pngBlob);
  return Buffer.from(await resultBlob.arrayBuffer());
}

async function removeBackgroundViaCloudinary(imageUrl: string): Promise<Buffer> {
  console.log('[AI BG] Removing background via Cloudinary AI...');

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload(
      imageUrl,
      {
        folder: 'Offerbuddy/ai-bg-remove',
        resource_type: 'image',
        format: 'png',
        transformation: [
          { background_removal: 'cloudinary_ai', format: 'png' },
        ],
      },
      (err, res) => {
        if (err) reject(err);
        else resolve(res as { secure_url: string });
      }
    );
  });

  return fetchBuffer(result.secure_url);
}

function extractReplicateUrl(output: unknown): string {
  if (!output) throw new Error('Replicate returned empty output');
  const item = Array.isArray(output) ? output[0] : output;
  if (item && typeof (item as { url?: () => string }).url === 'function') {
    return (item as { url: () => string }).url();
  }
  if (typeof item === 'string') return item;
  throw new Error(`Unexpected Replicate output format: ${JSON.stringify(item)}`);
}

function normalizeImageUrlForReplicate(imageUrl: string): string {
  if (!imageUrl.includes('res.cloudinary.com') || !imageUrl.includes('/image/upload/')) {
    return imageUrl;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  // Extract the public_id portion and drop transformations, version, and extension
  const m = imageUrl.match(/res\.cloudinary\.com\/[^\/]+\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?(?:\?.*)?$/i);
  if (!m) return imageUrl;
  const publicId = m[1];
  if (!cloudName) return imageUrl;

  // Build a clean PNG delivery URL (no transformations, full-quality PNG)
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_png/${publicId}`;
}

async function retryReplicate<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.response?.status || err?.status;
      const isRateLimit = status === 429 || (err?.message && err.message.includes('429'));
      const isNotFound = status === 404 || (err?.message && err.message.includes('404'));

      if (isNotFound) {
        throw new Error(
          `Replicate background removal model not found: ${REPLICATE_BG_MODELS}. ` +
          `Set REPLICATE_BG_MODEL to a valid slug or use AI_BG_REMOVAL=local.`
        );
      }

      if (isRateLimit && attempt < maxRetries) {
        const delayMs = (attempt + 1) * 8000;
        console.warn(`[AI BG] Replicate rate limit (429). Retrying in ${delayMs / 1000}s... (${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      throw err;
    }
  }
  return fn();
}

async function removeBackgroundViaReplicate(imageUrl: string): Promise<Buffer> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is required for background removal');
  }

  const inputImage = normalizeImageUrlForReplicate(imageUrl);
  let lastError: unknown;

  for (let index = 0; index < REPLICATE_BG_MODELS.length; index++) {
    const model = REPLICATE_BG_MODELS[index];
    console.log(`[AI BG] Trying Replicate bg remover model (${index + 1}/${REPLICATE_BG_MODELS.length}): ${model}`);

    try {
      const output = await retryReplicate(() => replicate.run(
        model as `${string}/${string}` | `${string}/${string}:${string}`,
        {
          input: {
            image: inputImage,
            format: 'png',
            background_type: 'rgba',
            threshold: 0,
          },
        }
      ));

      const cutoutUrl = extractReplicateUrl(output);
      return fetchBuffer(cutoutUrl);
    } catch (err: any) {
      lastError = err;
      const message = err?.message || String(err);
      console.warn(`[AI BG] Replicate model ${model} failed: ${message}`);

      if (index === REPLICATE_BG_MODELS.length - 1) {
        throw err;
      }

      console.log('[AI BG] Falling back to next Replicate model...');
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Replicate background removal failed');
}

/** Remove product background; uses Replicate on Vercel unless AI_BG_REMOVAL=local. */
export async function removeProductBackground(imageUrl: string): Promise<Buffer> {
  const provider = resolveBgRemovalProvider();

  if (provider === 'cloudinary') {
    return removeBackgroundViaCloudinary(imageUrl);
  }

  if (provider === 'replicate') {
    return await removeBackgroundViaReplicate(imageUrl);
  }

  try {
    return await removeBackgroundLocal(imageUrl);
  } catch (err) {
    console.warn('[AI BG] Local removal failed, falling back to Replicate:', err);
    return await removeBackgroundViaReplicate(imageUrl);
  }
}

/** Persist transparent cutout so status polling does not re-run removal. */
export async function uploadProductCutout(
  cutoutBuffer: Buffer,
  vendorId: string
): Promise<string> {
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `Offerbuddy/vendors/${vendorId}/ai-cutouts`,
        resource_type: 'image',
        format: 'png',
      },
      (err, res) => {
        if (err) reject(err);
        else resolve(res as { secure_url: string });
      }
    ).end(cutoutBuffer);
  });
  return result.secure_url;
}

async function trimTransparentEdges(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer).trim().png().toBuffer();
  } catch (err) {
    console.warn('[AI BG] Could not trim background removal output:', err);
    return buffer;
  }
}

export async function getOrCreateProductCutout(params: {
  imageUrl: string;
  vendorId: string;
  existingCutoutUrl?: string | null;
}): Promise<{ buffer: Buffer; cutoutUrl: string }> {
  if (params.existingCutoutUrl) {
    return {
      buffer: await fetchBuffer(params.existingCutoutUrl),
      cutoutUrl: params.existingCutoutUrl,
    };
  }

  const rawBuffer = await removeProductBackground(params.imageUrl);
  const buffer = await trimTransparentEdges(rawBuffer);
  const cutoutUrl = await uploadProductCutout(buffer, params.vendorId);
  return { buffer, cutoutUrl };
}

export function shouldDeferHeavyWorkOnStart(): boolean {
  if (process.env.AI_ENHANCE_FAST_START === 'false') return false;
  if (process.env.AI_ENHANCE_FAST_START === 'true') return true;
  return process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}
