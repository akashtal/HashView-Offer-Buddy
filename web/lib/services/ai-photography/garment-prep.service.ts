/**
 * Prepares vendor garment photos for virtual try-on (IDM-VTON).
 * IDM-VTON works best with a normal garment photo on a clean 3:4 canvas.
 * Do not remove the garment background by default; transparent tight crops can
 * make lower-body products like jeans fail or deform.
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
        format: 'jpg',
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
 * Clean garment image for VTON: 3:4 white canvas, original garment preserved.
 * Returns a Cloudinary URL suitable for IDM-VTON `garm_img`.
 */
export async function prepareGarmentForTryOn(params: {
  imageUrl: string;
  vendorId: string;
}): Promise<{ preparedGarmentUrl: string }> {
  console.log('[AI Try-On] Preparing garment for IDM-VTON...');

  let sourceBuffer: Buffer;

  if (process.env.TRYON_REMOVE_GARMENT_BG === 'true') {
    console.log('[AI Try-On] TRYON_REMOVE_GARMENT_BG=true; using transparent cutout.');
    sourceBuffer = await removeProductBackground(params.imageUrl);
  } else {
    const res = await fetch(params.imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch garment image: ${res.status}`);
    sourceBuffer = Buffer.from(await res.arrayBuffer());
  }

  const garmentPlate = await sharp({
    create: {
      width: 768,
      height: 1024,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      {
        input: await sharp(sourceBuffer)
          .rotate()
          .resize(704, 960, { fit: 'inside', withoutEnlargement: true })
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: 96 })
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .jpeg({ quality: 96 })
    .toBuffer();

  const preparedBuffer = garmentPlate;
  const preparedGarmentUrl = await uploadPreparedGarment(preparedBuffer, params.vendorId);
  console.log(`[AI Try-On] Prepared garment: ${preparedGarmentUrl}`);

  return { preparedGarmentUrl };
}
