import sharp from 'sharp';
import type { CompositionPlan, LightingProfile } from './types';

export async function generateShadowLayer(params: {
  productLayer: Buffer;
  productWidth: number;
  productHeight: number;
  productLeft: number;
  productTop: number;
  plan: CompositionPlan;
  lighting: LightingProfile;
}): Promise<{ input: Buffer; left: number; top: number }> {
  const shadowWidth = Math.round(params.productWidth * 0.92);
  const shadowHeight = Math.max(36, Math.round(params.productHeight * 0.16));
  const lightOffset = params.lighting.direction === 'left' ? 22 : params.lighting.direction === 'right' ? -22 : 0;
  const left = Math.round(params.productLeft + (params.productWidth - shadowWidth) / 2 + lightOffset);
  const top = Math.round(Math.min(params.plan.floorY - shadowHeight / 2, params.productTop + params.productHeight - shadowHeight * 0.62));

  const alpha = await sharp(params.productLayer)
    .ensureAlpha()
    .extractChannel('alpha')
    .resize(shadowWidth, shadowHeight, { fit: 'fill' })
    .blur(params.lighting.shadowBlur)
    .linear(params.lighting.shadowOpacity, 0)
    .toBuffer();

  const black = await sharp({
    create: {
      width: shadowWidth,
      height: shadowHeight,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();

  return { input: black, left, top };
}
