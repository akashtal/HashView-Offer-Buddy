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
  fashion: ['shirt', 'dress', 'kurta', 'jacket', 'jeans', 'top'],
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
}): Promise<ProductUnderstanding> {
  const heuristic = await heuristicProductAnalysis(params.imageBuffer, params.productName);

  if (process.env.GOOGLE_GEMINI_API_KEY) {
    const geminiResult = await analyzeWithGemini(params.imageBuffer, heuristic);
    if (geminiResult) return geminiResult;
  }

  if (!process.env.OPENAI_API_KEY || !params.imageUrl) {
    return heuristic;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  'Analyze this ecommerce product image. Return strict JSON with category, subcategory, material, orientation, dominantColor, style, sceneType, composition, confidence. Preserve product identity; recommend only scene/lighting/composition.',
              },
              { type: 'input_image', image_url: params.imageUrl },
            ],
          },
        ],
        text: { format: { type: 'json_object' } },
      }),
    });

    if (!response.ok) throw new Error(`OpenAI Vision failed: ${response.status}`);
    const payload = await response.json();
    const text = payload.output_text || payload.output?.[0]?.content?.[0]?.text;
    const parsed = JSON.parse(text);
    const category = normalizeCategory(parsed.category) || heuristic.category;

    return {
      ...heuristic,
      ...parsed,
      category,
      orientation: normalizeOrientation(parsed.orientation) || heuristic.orientation,
      confidence: clamp(Number(parsed.confidence) || 0.72, 0.1, 1),
      source: 'openai-vision',
    };
  } catch (error) {
    console.warn('[AI Understanding] Vision analysis failed; using heuristic fallback:', error);
    return heuristic;
  }
}

async function analyzeWithGemini(imageBuffer: Buffer, heuristic: ProductUnderstanding): Promise<ProductUnderstanding | null> {
  try {
    const pngBuffer = await sharp(imageBuffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
    const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text:
                    'Analyze this ecommerce product image. Return strict JSON only with category, subcategory, material, orientation, dominantColor, style, sceneType, composition, confidence. Preserve product identity; recommend only scene/lighting/composition.',
                },
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: pngBuffer.toString('base64'),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini Vision failed: ${response.status}`);
    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.find((part: any) => part.text)?.text;
    if (!text) throw new Error('Gemini returned no JSON text');
    const parsed = JSON.parse(text);
    const category = normalizeCategory(parsed.category) || heuristic.category;

    return {
      ...heuristic,
      ...parsed,
      category,
      orientation: normalizeOrientation(parsed.orientation) || heuristic.orientation,
      confidence: clamp(Number(parsed.confidence) || 0.72, 0.1, 1),
      source: 'gemini-vision',
    };
  } catch (error) {
    console.warn('[AI Understanding] Gemini analysis failed; trying next analyzer:', error);
    return null;
  }
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
    subcategory: category === 'generic' ? 'product' : category,
    material: defaults.material,
    orientation,
    dominantColor,
    style: defaults.style,
    sceneType: defaults.sceneType,
    composition: defaults.composition,
    confidence: category === 'generic' ? 0.35 : 0.58,
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

function normalizeCategory(value: string): ProductCategory | null {
  const normalized = String(value || '').toLowerCase();
  return (Object.keys(CATEGORY_KEYWORDS) as ProductCategory[]).find((category) => normalized.includes(category)) || null;
}

function normalizeOrientation(value: string): ProductOrientation | null {
  if (value === 'horizontal' || value === 'vertical' || value === 'square') return value;
  return null;
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
