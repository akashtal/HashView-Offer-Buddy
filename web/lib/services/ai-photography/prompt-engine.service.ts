/**
 * Prompt Engine Service
 *
 * Generates scene/background prompts for Flux Schnell (preview) and Flux Dev (premium).
 *
 * CRITICAL ARCHITECTURE RULE:
 * ─────────────────────────────────────────────────────────────────────────────
 * Flux Schnell is a 4-step distilled model. It does NOT support negative_prompt.
 * Negative prompts sent to Flux Schnell are SILENTLY IGNORED by the Replicate API.
 *
 * Therefore ALL product suppression must be encoded INSIDE the affirmative prompt
 * using "background plate only" language. This is the ONLY reliable way to prevent
 * Flux from hallucinating a duplicate product in the generated background.
 *
 * Flux Dev (premium) supports negative_prompt and we use it there as a secondary
 * reinforcement layer — never as the primary suppression strategy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';
import type {
  AiStyleLike,
  GenerationQuality,
  LightingProfile,
  ProductCategory,
  ProductUnderstanding,
  ScenePrompt,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Every prompt MUST start with this. It trains Flux to treat the output as
// an empty photography stage, not a product render.
// ─────────────────────────────────────────────────────────────────────────────
const BACKGROUND_PLATE_PREFIX =
  'Empty professional photography background plate with absolutely no product, no objects, no people. ' +
  'This is an environment-only image that will be used as a compositing backdrop. ' +
  'Photorealistic, studio-quality empty scene:';

// ─────────────────────────────────────────────────────────────────────────────
// Per-category SCENE descriptions. These describe ONLY the environment —
// surfaces, lighting, props, atmosphere. NEVER describe the product itself.
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_SCENE_PROMPTS: Record<ProductCategory, string> = {
  footwear:
    'low-angle athletic studio floor, polished concrete surface with subtle reflections, dramatic side lighting casting long shadows on empty floor, ' +
    'energetic premium sports-brand atmosphere, dark gradient background, no shoes or footwear of any kind anywhere in the image',

  watch:
    'dark polished stone tabletop surface, luxury macro photography set, controlled strip lights casting crisp highlights on empty surface, ' +
    'premium watch-brand atmosphere with bokeh background, smooth reflections on tabletop, no watch or clock or timepiece of any kind anywhere in the image',

  saree:
    'elegant boutique fashion studio interior, smooth seamless backdrop, warm diffused softbox lighting illuminating an empty floor area, ' +
    'premium fabric-photography mood, subtle floor shadow, no clothing, garment, fabric, or textile of any kind anywhere in the image',

  perfume:
    'luxury marble countertop with soft veining, cinematic side-lit beauty photography set, glass and chrome reflections on empty marble surface, ' +
    'premium fragrance-brand atmosphere, bokeh highlights, no bottle, container, or packaging of any kind anywhere in the image',

  electronics:
    'minimal futuristic technology studio, clean matte grey surface, soft cool LED strip lighting, subtle geometric shadow on empty flat surface, ' +
    'Apple-style commercial product photography mood, no device, phone, laptop, gadget, or electronics of any kind anywhere in the image',

  furniture:
    'modern Scandinavian living room interior, realistic hardwood floor, large window casting soft natural daylight across an empty floor area, ' +
    'architectural interior photography mood, warm neutral walls, no furniture, chair, table, sofa, or object of any kind anywhere in the image',

  jewelry:
    'premium black velvet surface with depth and texture, ultra-macro lighting with sparkle point highlights, ' +
    'luxury jewelry-brand studio atmosphere, subtle fabric texture in background, no ring, necklace, bracelet, earring, gemstone, or jewelry piece of any kind anywhere in the image',

  fashion:
    'clean fashion catalog studio, pure white or light grey seamless sweep, soft even full-body lighting, ' +
    'premium retail editorial mood, empty vertical framing area, no clothing, garment, pants, shirt, jeans, dress, or fashion item of any kind anywhere in the image',

  cosmetics:
    'soft pastel beauty vanity surface, marble or brushed pink counter, flatlay photography light, fresh botanical props framing empty center area, ' +
    'skincare campaign mood, no makeup, cream, bottle, tube, or cosmetic product of any kind anywhere in the image',

  bags:
    'premium boutique lifestyle surface, linen or leather-textured backdrop, warm accent lighting with soft side key light, ' +
    'editorial accessory photography mood, empty product display area, no bag, handbag, purse, backpack, or accessory of any kind anywhere in the image',

  generic:
    'clean premium ecommerce studio, pure white or light neutral seamless background, balanced commercial studio lighting, ' +
    'realistic surface with subtle shadow, marketplace-ready empty composition, no product, object, or item of any kind anywhere in the image',
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-category lighting profiles used for Sharp compositing (not for Flux)
// ─────────────────────────────────────────────────────────────────────────────
const LIGHTING_BY_CATEGORY: Record<ProductCategory, LightingProfile> = {
  footwear:  { name: 'sport studio side key',       direction: 'left',  temperature: 'neutral', brightness: 1.03, contrast: 1.06, shadowOpacity: 0.32, shadowBlur: 28 },
  watch:     { name: 'macro luxury strip lights',   direction: 'right', temperature: 'cool',    brightness: 0.99, contrast: 1.04, shadowOpacity: 0.38, shadowBlur: 20 },
  saree:     { name: 'soft fashion key light',      direction: 'front', temperature: 'warm',    brightness: 1.04, contrast: 1.02, shadowOpacity: 0.20, shadowBlur: 34 },
  perfume:   { name: 'cinematic beauty highlights', direction: 'right', temperature: 'neutral', brightness: 1.03, contrast: 1.04, shadowOpacity: 0.24, shadowBlur: 22 },
  electronics:{ name: 'clean tech studio light',   direction: 'top',   temperature: 'cool',    brightness: 1.02, contrast: 1.04, shadowOpacity: 0.24, shadowBlur: 26 },
  furniture: { name: 'large window daylight',       direction: 'left',  temperature: 'warm',    brightness: 1.02, contrast: 1.02, shadowOpacity: 0.28, shadowBlur: 40 },
  jewelry:   { name: 'hard macro sparkle light',    direction: 'right', temperature: 'neutral', brightness: 1.01, contrast: 1.02, shadowOpacity: 0.44, shadowBlur: 16 },
  fashion:   { name: 'editorial softbox',           direction: 'front', temperature: 'neutral', brightness: 1.03, contrast: 1.02, shadowOpacity: 0.20, shadowBlur: 32 },
  cosmetics: { name: 'soft beauty glow',            direction: 'front', temperature: 'warm',    brightness: 1.04, contrast: 1.02, shadowOpacity: 0.18, shadowBlur: 30 },
  bags:      { name: 'boutique soft side light',    direction: 'left',  temperature: 'warm',    brightness: 1.03, contrast: 1.03, shadowOpacity: 0.26, shadowBlur: 28 },
  generic:   { name: 'balanced ecommerce studio',  direction: 'front', temperature: 'neutral', brightness: 1.02, contrast: 1.03, shadowOpacity: 0.22, shadowBlur: 28 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-style scene overrides. Each describes ONLY the background environment.
// These are injected into the prompt when a specific style preset is selected.
// Every entry MUST end with "no product" language to reinforce suppression.
// ─────────────────────────────────────────────────────────────────────────────
const STYLE_SCENE_BY_SLUG: Record<string, string> = {
  'amazon-clean':
    'Pure white or warm neutral photography sweep, soft diffused overhead studio light, ' +
    'clean shadow-contact area on floor, professional e-commerce marketplace backdrop, ' +
    'absolutely no product, object, or item anywhere in the scene',

  'luxury-gold':
    'Black marble surface with gold metallic veins, dramatic cinematic lighting with warm gold rim light, ' +
    'deep dark background with bokeh depth, luxury premium brand atmosphere, premium reflections on empty marble, ' +
    'absolutely no product, object, or item anywhere in the scene',

  'instagram-viral':
    'Bright airy natural daylight lifestyle background, soft pastel tones, fresh botanical props and flowers ' +
    'arranged only near edges leaving center empty, social commerce aesthetic, ' +
    'absolutely no product, object, or item in the center or foreground of the scene',

  'nike-style':
    'Bold high-contrast athletic studio backdrop, hard dramatic shadows on dark floor, ' +
    'energetic motion-blur light streaks in background, premium sports-brand atmosphere, reflective dark concrete floor, ' +
    'absolutely no product, object, footwear, or item anywhere in the scene',

  'nature-organic':
    'Rustic warm wood or natural stone surface, dappled golden-hour sunlight, ' +
    'fresh green leaves and botanical elements arranged only at edges, soft organic earthy mood, ' +
    'absolutely no product, object, or item anywhere in the center of the scene',

  'fashion-model':
    'Premium fashion studio seamless white or warm grey sweep, full-body soft directional studio lighting, ' +
    'clean empty vertical composition area, boutique editorial photography atmosphere, smooth floor reflection, ' +
    'absolutely no person, mannequin, clothing, garment, or product anywhere in the scene',

  'jewelry-premium':
    'Ultra-luxurious black velvet macro photography surface, controlled sparkle specular highlights, ' +
    'deep rich dark background with subtle depth, premium jeweler\'s showcase atmosphere, empty velvet center, ' +
    'absolutely no ring, necklace, bracelet, earring, gemstone, jewelry, or any object anywhere in the scene',

  'tech-commercial':
    'Minimal futuristic technology studio, clean slate grey or white surface, ' +
    'cool LED accent lights creating clean geometric shadows on empty surface, precision commercial tech aesthetic, ' +
    'absolutely no phone, laptop, device, gadget, electronics, or product anywhere in the scene',

  'furniture-room':
    'Modern interior room with realistic hardwood floor, Scandinavian design aesthetic, ' +
    'large natural window casting soft daylight across empty floor area, architectural photography mood, ' +
    'absolutely no furniture, chair, table, sofa, bed, or object anywhere in the scene',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main prompt builder
// ─────────────────────────────────────────────────────────────────────────────
export function buildScenePrompt(params: {
  productName?: string;
  understanding: ProductUnderstanding;
  style?: AiStyleLike | null;
  quality?: GenerationQuality;
  vendorPreferences?: string;
  lightingType?: string;
}): ScenePrompt {
  const { understanding, style, quality = 'preview' } = params;
  const lightingProfile = mergeLighting(
    LIGHTING_BY_CATEGORY[understanding.category],
    style?.lightingConfig,
    params.lightingType,
  );

  const sceneType   = style?.sceneType || understanding.sceneType;
  const styleScene  = getStyleScene(style?.slug, style?.promptTemplate, understanding.category);
  const categoryScene = CATEGORY_SCENE_PROMPTS[understanding.category];

  const detailLevel =
    quality === 'premium'
      ? 'ultra-realistic 8K, detailed material response, professional studio output'
      : 'high-quality 4K photorealistic, commercial photography';

  // ── Affirmative prompt — product suppression embedded throughout ──
  const prompt = [
    BACKGROUND_PLATE_PREFIX,
    // Style-specific scene takes priority; category scene fills in when no style
    styleScene || categoryScene,
    // Lighting description (this is for the scene, not for Flux relighting)
    `Lighting: ${lightingProfile.name}, ${lightingProfile.temperature} temperature, key from ${lightingProfile.direction}.`,
    // Vendor preferences (these are additional scene preferences, not product descriptions)
    params.vendorPreferences
      ? `Additional scene mood: ${params.vendorPreferences.slice(0, 120)}.`
      : '',
    `${detailLevel}. Depth of field, atmospheric integration, realistic surface contact area and reflections.`,
    // Final affirmative lock — strongest possible background-only statement
    'The image shows ONLY the empty background environment. There is NO product, NO object, NO subject, NO foreground item of any kind. Only the scene, surface, and atmosphere.',
  ]
    .filter(Boolean)
    .join(' ');

  // ── Negative prompt — only used by Flux Dev (premium) ──
  // Flux Schnell ignores this. Flux Dev uses it as secondary reinforcement.
  const negativePrompt = [
    // Category-level negatives
    getCategoryNegatives(understanding.category),
    // Generic quality/artifact negatives
    'product, object, item, foreground subject, duplicate product, second product, extra object, ' +
    'person, human, hand, mannequin, display stand, logo, label, text, watermark, ' +
    'low quality, blurry, noise, artifacts, cartoon, illustration, painting, drawing',
    // Style negatives
    style?.negativePrompt || '',
  ]
    .filter(Boolean)
    .join(', ');

  const cacheKey = crypto
    .createHash('sha256')
    .update(JSON.stringify({ prompt, negativePrompt, quality, sceneType }))
    .digest('hex');

  return {
    prompt,
    negativePrompt,
    styleName: style?.name || 'Auto Recommended',
    sceneType,
    lightingProfile,
    quality,
    cacheKey,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getStyleScene(
  slug?: string,
  promptTemplate?: string,
  category?: ProductCategory,
): string {
  // 1. Exact slug match (most specific)
  if (slug && STYLE_SCENE_BY_SLUG[slug]) return STYLE_SCENE_BY_SLUG[slug];

  // 2. Admin-provided template — sanitise it to ensure no product description slips in
  if (promptTemplate) {
    const sanitised = promptTemplate
      // Replace any reference to a specific product with "area"
      .replace(/\{product\}/gi, 'empty placement area')
      .replace(/photo(?:graphy)? of a[n]? [^,.]+/gi, 'background plate')
      .replace(/product (?:shot|image|photo)/gi, 'background plate')
      .replace(/\bplaced on\b/gi, 'empty surface with');
    // Append category no-product clause
    const catSuffix = category
      ? `, ${CATEGORY_SCENE_PROMPTS[category].split(',')[0]}, absolutely no product or object anywhere`
      : ', absolutely no product or object anywhere';
    return sanitised + catSuffix;
  }

  return '';
}

function getCategoryNegatives(category: ProductCategory): string {
  const negativesByCategory: Record<ProductCategory, string> = {
    footwear:    'shoes, sneakers, boots, sandals, trainers, footwear, sole',
    watch:       'watch, wristwatch, chronograph, dial, strap, clock',
    saree:       'saree, sari, fabric, textile, garment, drape, dupatta',
    perfume:     'perfume, bottle, fragrance, cologne, spray, packaging',
    electronics: 'phone, laptop, tablet, headphones, earbuds, speaker, gadget, device, charger',
    furniture:   'chair, sofa, couch, table, desk, bed, shelf, cabinet, furniture',
    jewelry:     'ring, necklace, bracelet, earring, bangle, gemstone, diamond, jewel, gold, silver jewelry',
    fashion:     'jeans, pants, shirt, dress, top, jacket, hoodie, clothing, garment, outfit',
    cosmetics:   'lipstick, cream, serum, makeup, jar, tube, bottle, cosmetic, skincare',
    bags:        'bag, handbag, purse, backpack, wallet, clutch, tote',
    generic:     'product, item, object, packaging',
  };
  return negativesByCategory[category] || negativesByCategory.generic;
}

function mergeLighting(
  base: LightingProfile,
  override?: Partial<LightingProfile>,
  lightingType?: string,
): LightingProfile {
  const merged = { ...base, ...(override || {}) };
  if (lightingType) merged.name = `${lightingType} ${merged.name}`;
  return merged;
}
