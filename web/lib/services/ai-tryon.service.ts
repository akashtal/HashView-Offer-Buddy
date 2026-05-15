import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import AiModel from '@/models/AiModel';
import { analyzeProductImage } from '@/lib/services/ai-photography/product-understanding.service';
import { generateTryOnAsync, determineTryOnCategory, uploadTryOnImage, extractReplicateUrl, TryOnRequest, TryOnResult } from '@/lib/services/ai-photography/virtual-tryon.service';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Helper: fetch buffer
async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function startVirtualTryOn(
  request: TryOnRequest,
  vendorId: string
): Promise<TryOnResult> {
  const { productId, imageUrl, modelImageUrl, garmentDescription, vendorPreferences } = request;

  console.log(`[AI Try-On] Analyzing product image...`);
  const originalBuffer = await fetchBuffer(imageUrl);
  const productUnderstanding = await analyzeProductImage({
    imageBuffer: originalBuffer,
    imageUrl: imageUrl,
    productName: garmentDescription,
  });

  const category = determineTryOnCategory(productUnderstanding);
  console.log(`[AI Try-On] Category determined as: ${category}`);

  // Generate prediction
  const predictionId = await generateTryOnAsync(
    modelImageUrl,
    imageUrl,
    category,
    garmentDescription || `${productUnderstanding.dominantColor || ''} ${productUnderstanding.subcategory || ''}`
  );

  await connectDB();
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const pendingEntry = {
    originalUrl: imageUrl,
    enhancedUrl: '', // To be filled during polling
    styleId: null,
    customBackgroundUrl: modelImageUrl,
    status: 'processing' as const,
    predictionId,
    metadata: {
      category: productUnderstanding.category,
      workflow: 'virtual-try-on-reference',
      productUnderstanding,
      vendorModelReference: modelImageUrl,
      tryOnCategory: category
    },
    category: productUnderstanding.category,
    sceneType: 'virtual-try-on',
    vendorModelReference: modelImageUrl,
    createdAt: new Date(),
  };

  product.aiGallery = product.aiGallery || [];
  product.aiGallery.push(pendingEntry as any);
  await product.save();

  const entryId = (product.aiGallery[product.aiGallery.length - 1] as any)._id.toString();
  console.log(`[AI Try-On] Started for product ${productId}. Prediction: ${predictionId}`);
  
  return { aiGalleryEntryId: entryId, predictionId };
}

export async function checkTryOnStatus(
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
    console.log(`[AI Try-On] Prediction ${entry.predictionId} succeeded.`);
    try {
      const outputUrl = extractReplicateUrl(prediction.output);
      console.log(`[AI Try-On] Output URL: ${outputUrl}`);
      
      const cloudUrl = await uploadTryOnImage(outputUrl, vendorId);
      
      entry.status = 'done';
      entry.enhancedUrl = cloudUrl;
      await product.save();
      return { status: 'done', enhancedUrl: cloudUrl };
    } catch (err) {
      console.error('[AI Try-On] Upload failed:', err);
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
