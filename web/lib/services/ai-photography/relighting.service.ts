/**
 * Relighting Service
 *
 * Applies subtle luminance adjustments to the product cutout before compositing.
 *
 * CRITICAL RULE: Product identity MUST be 100% preserved.
 * ─────────────────────────────────────────────────────────────────────────────
 * - Gold must stay gold. Silver must stay silver. Red must stay red.
 * - This service MUST NOT tint, recolor, or materially alter the product pixels.
 * - Contrast and brightness are adjusted in very small ranges only.
 *
 * High-fidelity categories (jewelry, watch, perfume, cosmetics) receive
 * ZERO contrast adjustment to ensure material accuracy.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The scene lighting mismatch is handled by generating a background that matches
 * the product's ambient exposure — NOT by modifying the product pixels themselves.
 */

import sharp from 'sharp';
import type { LightingProfile, ProductCategory, ProductUnderstanding } from './types';

/**
 * Categories where color/material accuracy is critical.
 * These receive zero contrast modification and minimal brightness change.
 */
const HIGH_FIDELITY_CATEGORIES: Set<ProductCategory> = new Set([
  'jewelry',
  'watch',
  'perfume',
  'cosmetics',
]);

export async function relightProductImage(params: {
  productBuffer: Buffer;
  lighting: LightingProfile;
  understanding: ProductUnderstanding;
}): Promise<Buffer> {
  const { productBuffer, lighting, understanding } = params;
  const category = understanding.category;

  const isHighFidelity = HIGH_FIDELITY_CATEGORIES.has(category);

  // High-fidelity categories: absolutely no contrast change, minimal brightness only.
  // This preserves gold, gemstone colors, and cosmetic packaging exactly.
  if (isHighFidelity) {
    return sharp(productBuffer)
      .ensureAlpha()
      .modulate({
        brightness: clamp(lighting.brightness, 0.97, 1.04), // max ±4% brightness
        saturation: 1.0, // no saturation shift
      })
      // No linear contrast — identity-safe output
      .png()
      .toBuffer();
  }

  // Standard categories: very small contrast range ±5%, brightness ±6%
  const safeBrightness = clamp(lighting.brightness, 0.96, 1.06);
  const safeContrast   = clamp(lighting.contrast,   0.97, 1.05); // was going to 1.22 — fixed

  // linear(a, b) = pixel * a + b. With contrast close to 1.0 the offset is tiny.
  const linearOffset = -(128 * (safeContrast - 1));

  return sharp(productBuffer)
    .ensureAlpha()
    .modulate({
      brightness: safeBrightness,
      saturation: 1.01, // barely perceptible richness boost
    })
    .linear(safeContrast, linearOffset)
    .png()
    .toBuffer();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
