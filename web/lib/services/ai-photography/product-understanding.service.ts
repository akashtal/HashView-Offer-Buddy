import sharp from 'sharp';
import type { ProductUnderstanding, ProductCategory, ProductOrientation } from './types';

const CATEGORY_KEYWORDS: Record<ProductCategory, string[]> = {
  footwear: ['shoe', 'sneaker', 'trainer', 'sandal', 'heel', 'boot'],
  watch: ['watch', 'wristwatch', 'chronograph'],
  saree: ['saree', 'sari', 'lehenga', 'dupatta'],
  perfume: ['perfume', 'fragrance', 'cologne', 'bottle'],
  electronics: ['phone', 'laptop', 'earbud', 'headphone', 'camera', 'speaker', 'charger'],
  furniture: ['chair', 'sofa', 'table', 'desk', 'bed', 'cabinet'],
  jewelry: ['ring', 'necklace', 'bracelet', 'earring', 'jewel', 'diamond', 'gold'],
  fashion: ['shirt', 'dress', 'kurta', 'jacket', 'jeans', 'top', 'pants', 'trouser', 'tshirt', 't-shirt', 'hoodie'],
  cosmetics: ['makeup', 'lipstick', 'cream', 'serum', 'cosmetic', 'skincare'],
  bags: ['bag', 'handbag', 'backpack', 'purse', 'wallet'],
  generic: [],
};

const CATEGORY_DEFAULTS: Record<ProductCategory, Pick<ProductUnderstanding, 'style' | 'sceneType' | 'composition' | 'material'>> = {
  footwear: { style: 'sports luxury', sceneType: 'urban premium studio', composition: 'low-angle lower-third hero framing', material: 'mixed textile/leather' },
  watch: { style: 'luxury macro', sceneType: 'dark premium tabletop', composition: 'centered macro hero framing', material: 'metal and glass' },
  saree: { style: 'fashion editorial', sceneType: 'boutique fashion studio', composition: 'vertical drape-forward composition', material: 'woven textile' },
  perfume: { style: 'luxury commercial', sceneType: 'marble reflective studio', composition: 'centered bottle macro with reflections', material: 'glass' },
  electronics: { style: 'tech commercial', sceneType: 'minimal futuristic studio', composition: 'centered clean product hero', material: 'metal/plastic/glass' },
  furniture: { style: 'interior editorial', sceneType: 'modern room with natural daylight', composition: 'room-scale grounded placement', material: 'wood/fabric/metal' },
  jewelry: { style: 'jewelry premium', sceneType: 'black velvet macro studio', composition: 'macro close-up with negative space', material: 'precious metal/gemstone' },
  fashion: { style: 'fashion editorial', sceneType: 'clean boutique studio', composition: 'vertical catalog framing', material: 'textile' },
  cosmetics: { style: 'beauty commercial', sceneType: 'soft pastel vanity studio', composition: 'centered beauty product arrangement', material: 'cosmetic packaging' },
  bags: { style: 'premium lifestyle', sceneType: 'boutique studio with soft props', composition: 'three-quarter hero product angle', material: 'leather/fabric' },
  generic: { style: 'marketplace commercial', sceneType: 'clean premium studio', composition: 'centered product hero', material: 'unknown' },
};

export async function analyzeProductImage(params: {
  imageBuffer: Buffer;
  imageUrl?: string;
  productName?: string;
  /** Kept for API compatibility; product understanding is local-only. */
  fastOnly?: boolean;
}): Promise<ProductUnderstanding> {
  return heuristicProductAnalysis(params.imageBuffer, params.productName);
}

async function heuristicProductAnalysis(imageBuffer: Buffer, productName = ''): Promise<ProductUnderstanding> {
  const meta = await sharp(imageBuffer).metadata();
  const stats = await sharp(imageBuffer).resize(64, 64, { fit: 'inside' }).stats();
  const orientation = getOrientation(meta.width || 1, meta.height || 1);
  const category = inferCategory(productName);
  const defaults = CATEGORY_DEFAULTS[category];
  const dominantColor = rgbToHex(
    Math.round(stats.channels[0]?.mean || 128),
    Math.round(stats.channels[1]?.mean || 128),
    Math.round(stats.channels[2]?.mean || 128)
  );

  return {
    category,
    subcategory: inferSubcategory(productName, category),
    material: defaults.material,
    orientation,
    dominantColor,
    style: defaults.style,
    sceneType: defaults.sceneType,
    composition: defaults.composition,
    confidence: category === 'generic' ? 0.35 : 0.65,
    source: 'heuristic',
  };
}

function inferCategory(productName: string): ProductCategory {
  const normalized = productName.toLowerCase();
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS) as [ProductCategory, string[]][]) {
    if (words.some((word) => normalized.includes(word))) return category;
  }
  return 'generic';
}

function inferSubcategory(productName: string, category: ProductCategory): string {
  const normalized = productName.toLowerCase();
  const words = CATEGORY_KEYWORDS[category] || [];
  return words.find((word) => normalized.includes(word)) || (category === 'generic' ? 'product' : category);
}

function getOrientation(width: number, height: number): ProductOrientation {
  const ratio = width / height;
  if (ratio > 1.15) return 'horizontal';
  if (ratio < 0.85) return 'vertical';
  return 'square';
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
