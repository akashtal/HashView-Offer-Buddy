import sharp from 'sharp';
import type { CompositionPlan, ProductCategory, ProductOrientation } from './types';

export function buildCompositionPlan(params: {
  category: ProductCategory;
  orientation: ProductOrientation;
  canvasSize?: number;
  styleRules?: Partial<CompositionPlan>;
}): CompositionPlan {
  const canvasSize = params.canvasSize || 1024;
  const base = planByCategory(params.category, canvasSize);

  if (params.orientation === 'vertical') {
    base.productMaxWidth = Math.min(base.productMaxWidth, Math.round(canvasSize * 0.62));
    base.productMaxHeight = Math.round(canvasSize * 0.82);
  }

  if (params.orientation === 'horizontal') {
    base.productMaxWidth = Math.round(canvasSize * 0.82);
    base.productMaxHeight = Math.min(base.productMaxHeight, Math.round(canvasSize * 0.58));
  }

  return { ...base, ...(params.styleRules || {}) };
}

export async function prepareProductLayer(productBuffer: Buffer, plan: CompositionPlan): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  left: number;
  top: number;
}> {
  const resized = await sharp(productBuffer)
    .resize(plan.productMaxWidth, plan.productMaxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .png()
    .toBuffer();

  const metadata = await sharp(resized).metadata();
  const width = metadata.width || plan.productMaxWidth;
  const height = metadata.height || plan.productMaxHeight;
  const left = Math.round((plan.canvasSize - width) / 2 + plan.xOffset);
  const top = getTop(plan, height);

  return { buffer: resized, width, height, left, top };
}

function planByCategory(category: ProductCategory, canvasSize: number): CompositionPlan {
  const common = { canvasSize, xOffset: 0, yOffset: 0 };
  switch (category) {
    case 'footwear':
      return { ...common, productMaxWidth: 840, productMaxHeight: 560, gravity: 'lower-third', floorY: 790, yOffset: 25 };
    case 'watch':
    case 'jewelry':
      return { ...common, productMaxWidth: 700, productMaxHeight: 700, gravity: 'center', floorY: 760 };
    case 'furniture':
      return { ...common, productMaxWidth: 860, productMaxHeight: 760, gravity: 'bottom', floorY: 870 };
    case 'saree':
    case 'fashion':
      return { ...common, productMaxWidth: 650, productMaxHeight: 870, gravity: 'bottom', floorY: 900 };
    case 'perfume':
    case 'cosmetics':
      return { ...common, productMaxWidth: 620, productMaxHeight: 760, gravity: 'lower-third', floorY: 840 };
    case 'electronics':
      return { ...common, productMaxWidth: 760, productMaxHeight: 680, gravity: 'center', floorY: 800 };
    case 'bags':
      return { ...common, productMaxWidth: 720, productMaxHeight: 740, gravity: 'lower-third', floorY: 840 };
    default:
      return { ...common, productMaxWidth: 760, productMaxHeight: 760, gravity: 'center', floorY: 820 };
  }
}

function getTop(plan: CompositionPlan, height: number): number {
  if (plan.gravity === 'bottom') return Math.round(plan.floorY - height + plan.yOffset);
  if (plan.gravity === 'lower-third') return Math.round(plan.floorY - height + plan.yOffset);
  if (plan.gravity === 'upper-third') return Math.round(plan.canvasSize * 0.22 + plan.yOffset);
  return Math.round((plan.canvasSize - height) / 2 + plan.yOffset);
}
