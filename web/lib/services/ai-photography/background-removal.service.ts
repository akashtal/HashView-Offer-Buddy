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

const REPLICATE_BG_MODEL =
  process.env.REPLICATE_BG_MODEL || '851-labs/background-remover';

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

function resolveBgRemovalProvider(): 'local' | 'replicate' {
  const explicit = process.env.AI_BG_REMOVAL?.toLowerCase();
  if (explicit === 'replicate') return 'replicate';
  if (explicit === 'local') return 'local';
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

function extractReplicateUrl(output: unknown): string {
  if (!output) throw new Error('Replicate returned empty output');
  const item = Array.isArray(output) ? output[0] : output;
  if (item && typeof (item as { url?: () => string }).url === 'function') {
    return (item as { url: () => string }).url();
  }
  if (typeof item === 'string') return item;
  throw new Error(`Unexpected Replicate output format: ${JSON.stringify(item)}`);
}

async function removeBackgroundViaReplicate(imageUrl: string): Promise<Buffer> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is required for background removal');
  }

  console.log(`[AI BG] Removing background via Replicate (${REPLICATE_BG_MODEL})...`);
  const prediction = await replicate.predictions.create({
    model: REPLICATE_BG_MODEL,
    input: {
      image: imageUrl,
      format: 'png',
      background_type: 'rgba',
      threshold: 0,
    },
  });

  const maxAttempts = 45;
  for (let i = 0; i < maxAttempts; i++) {
    const current = await replicate.predictions.get(prediction.id);
    if (current.status === 'succeeded') {
      const cutoutUrl = extractReplicateUrl(current.output);
      return fetchBuffer(cutoutUrl);
    }
    if (current.status === 'failed' || current.status === 'canceled') {
      throw new Error(`Background removal ${current.status}: ${current.error || 'unknown'}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Background removal timed out');
}

/** Remove product background; uses Replicate on Vercel unless AI_BG_REMOVAL=local. */
export async function removeProductBackground(imageUrl: string): Promise<Buffer> {
  const provider = resolveBgRemovalProvider();

  if (provider === 'replicate') {
    return removeBackgroundViaReplicate(imageUrl);
  }

  try {
    return await removeBackgroundLocal(imageUrl);
  } catch (err) {
    console.warn('[AI BG] Local removal failed, falling back to Replicate:', err);
    return removeBackgroundViaReplicate(imageUrl);
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

  const buffer = await removeProductBackground(params.imageUrl);
  const cutoutUrl = await uploadProductCutout(buffer, params.vendorId);
  return { buffer, cutoutUrl };
}

export function shouldDeferHeavyWorkOnStart(): boolean {
  if (process.env.AI_ENHANCE_FAST_START === 'false') return false;
  if (process.env.AI_ENHANCE_FAST_START === 'true') return true;
  return process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}
