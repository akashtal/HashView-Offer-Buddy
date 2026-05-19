import { v2 as cloudinary } from 'cloudinary';
import Replicate from 'replicate';
import type { ProductUnderstanding } from './types';

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
// IDM-VTON model version (cuuupid/idm-vton on Replicate)
// Version hash: https://replicate.com/cuuupid/idm-vton
// ─────────────────────────────────────────────────────────────────
const IDM_VTON_VERSION = '0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
// IDM-VTON categories differ from FASHN — map accordingly
export type TryOnCategory = 'upper_body' | 'lower_body' | 'dresses';

export interface TryOnRequest {
  productId: string;
  imageUrl: string;         // Cloudinary URL of the raw product image
  modelImageUrl: string;    // Cloudinary/External URL of the human model
  garmentDescription?: string;
  vendorPreferences?: string;
}

export interface TryOnResult {
  aiGalleryEntryId: string;
  predictionId: string;
}

// ─────────────────────────────────────────────────────────────────
// Retry wrapper for Replicate API calls
// ─────────────────────────────────────────────────────────────────
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRateLimit = err?.response?.status === 429 || err?.status === 429 ||
        (err?.message && err.message.includes('429'));
      if (isRateLimit && attempt < maxRetries) {
        const delay = (attempt + 1) * 8000;
        console.warn(`[AI Try-On] Rate limited (429). Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

// ─────────────────────────────────────────────────────────────────
// Determine Try-On Category based on Product Understanding
// Maps to IDM-VTON categories: upper_body | lower_body | dresses
// ─────────────────────────────────────────────────────────────────
export function determineTryOnCategory(
  understanding: ProductUnderstanding | any,
  garmentDescription = ''
): TryOnCategory {
  const text = `${garmentDescription} ${understanding?.category} ${understanding?.subcategory} ${understanding?.style}`.toLowerCase();

  if (
    text.includes('pant') || text.includes('jean') || text.includes('short') ||
    text.includes('skirt') || text.includes('trouser') || text.includes('bottom') ||
    text.includes('legging') || text.includes('wide-leg') || text.includes('wide leg')
  ) {
    return 'lower_body';
  }

  if (
    text.includes('dress') || text.includes('saree') || text.includes('sari') ||
    text.includes('suit') || text.includes('one-piece') || text.includes('gown') ||
    text.includes('kurta set') || text.includes('jumpsuit')
  ) {
    return 'dresses';
  }

  // Default to upper_body for shirts, jackets, tops, etc.
  return 'upper_body';
}

// ─────────────────────────────────────────────────────────────────
// Generate Try-On using IDM-VTON (cuuupid/idm-vton on Replicate)
// ─────────────────────────────────────────────────────────────────
export async function generateTryOnAsync(
  modelImageUrl: string,
  garmentImageUrl: string,
  category: TryOnCategory,
  garmentDescription?: string
): Promise<string> {
  console.log(`[AI Try-On] Starting IDM-VTON generation for category: ${category}`);

  const prediction = await retryWithBackoff(() =>
    replicate.predictions.create({
      version: IDM_VTON_VERSION,
      input: {
        human_img: modelImageUrl,
        garm_img: garmentImageUrl,
        category: category,
        garment_des: garmentDescription || '',
        crop: true,       // auto-crop if aspect ratio != 3:4
        steps: 30,
        seed: 42,
        force_dc: category === 'dresses', // use DressCode variant for dresses
        mask_only: false,
      },
    })
  );

  console.log(`[AI Try-On] Prediction created: ${prediction.id}`);
  return prediction.id;
}

// ─────────────────────────────────────────────────────────────────
// Helper: extract URL from Replicate output
// ─────────────────────────────────────────────────────────────────
export function extractReplicateUrl(output: unknown): string {
  if (!output) throw new Error('Replicate returned empty output');
  const item = Array.isArray(output) ? output[0] : output;
  if (item && typeof (item as any).url === 'function') return (item as any).url();
  if (typeof item === 'string') return item;
  throw new Error(`Unexpected Replicate output format: ${JSON.stringify(item)}`);
}

// ─────────────────────────────────────────────────────────────────
// Upload final image to Cloudinary
// ─────────────────────────────────────────────────────────────────
export async function uploadTryOnImage(
  replicateOutputUrl: string,
  vendorId: string
): Promise<string> {
  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload(
      replicateOutputUrl,
      {
        folder: `Offerbuddy/vendors/${vendorId}/ai-tryon`,
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
