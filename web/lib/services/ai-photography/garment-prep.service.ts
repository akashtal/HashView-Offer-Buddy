/**
 * Prepares vendor garment photos for virtual try-on (IDM-VTON).
 * Removes background and trims transparent padding for a tight garment plate.
 */

import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { removeProductBackground } from '@/lib/services/ai-photography/background-removal.service';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function uploadPreparedGarment(buffer: Buffer, vendorId: string): Promise<string> {
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `Offerbuddy/vendors/${vendorId}/ai-garments`,
        resource_type: 'image',
        format: 'png',
      },
      (err, res) => {
        if (err) reject(err);
        else resolve(res as { secure_url: string });
      }
    ).end(buffer);
  });
  return result.secure_url;
}

/**
 * Clean garment image for VTON: transparent background + tight crop.
 * Returns a Cloudinary URL suitable for IDM-VTON `garm_img`.
 */
export async function prepareGarmentForTryOn(params: {
  imageUrl: string;
  vendorId: string;
}): Promise<{ preparedGarmentUrl: string }> {
  console.log('[AI Try-On] Preparing garment (background removal + trim)...');

  const cutoutBuffer = await removeProductBackground(params.imageUrl);

  let preparedBuffer = cutoutBuffer;
  try {
    preparedBuffer = await sharp(cutoutBuffer).trim().png().toBuffer();
  } catch {
    console.warn('[AI Try-On] Could not trim garment cutout; using full bounds.');
  }

  const preparedGarmentUrl = await uploadPreparedGarment(preparedBuffer, params.vendorId);
  console.log(`[AI Try-On] Prepared garment: ${preparedGarmentUrl}`);

  return { preparedGarmentUrl };
}
