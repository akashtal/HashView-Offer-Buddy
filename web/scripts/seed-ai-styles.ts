/**
 * Seed AI Styles into MongoDB.
 * Run: npx tsx scripts/seed-ai-styles.ts
 *
 * This script ALWAYS performs an upsert — existing records are updated
 * so that prompt changes made in code are reflected in the database.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

/**
 * All prompt templates here are BACKGROUND PLATE ONLY prompts.
 * They describe the scene/environment with NO product mentioned.
 * This is required because Flux Schnell ignores negative_prompt.
 */
const defaultStyles = [
  {
    name: 'Amazon Clean',
    slug: 'amazon-clean',
    description: 'Classic white marketplace background. Works for any product.',
    bestFor: 'All categories',
    emoji: '🛒',
    promptTemplate:
      'Pure white or softly warm neutral photography sweep background plate only. ' +
      'Soft diffused overhead studio lighting. Clean ecommerce marketplace atmosphere. ' +
      'Subtle shadow contact area on floor. Absolutely no product, object, or item of any kind.',
    negativePrompt:
      'product, object, item, foreground, colorful background, noise, watermark, text, humans, hands, low quality, blurry, cartoon',
    thumbnailUrl: '',
    isActive: true,
    sceneType: 'clean white marketplace studio',
    categoryCompatibility: [], // empty = compatible with all
    lightingConfig: {
      name: 'large softbox ecommerce lighting',
      direction: 'front',
      temperature: 'neutral',
      brightness: 1.03,
      contrast: 1.02,
      shadowOpacity: 0.20,
      shadowBlur: 32,
    },
    compositionRules: { gravity: 'center', floorY: 820 },
  },
  {
    name: 'Luxury Gold',
    slug: 'luxury-gold',
    description: 'Dark marble with gold accents. Premium brand feel.',
    bestFor: 'Jewelry, Watch, Perfume, Bags',
    emoji: '✨',
    promptTemplate:
      'Black marble countertop surface with gold metallic veins background plate only. ' +
      'Dramatic cinematic lighting with warm gold rim light from the right. ' +
      'Deep dark bokeh background, premium luxury brand atmosphere. ' +
      'Empty reflective marble surface with no product or object of any kind.',
    negativePrompt:
      'product, object, item, foreground, plain background, cheap look, cartoon, low quality, blurry, watermark, text',
    thumbnailUrl: '',
    isActive: true,
    sceneType: 'black marble luxury studio',
    categoryCompatibility: ['watch', 'perfume', 'jewelry', 'bags', 'cosmetics'],
    lightingConfig: {
      name: 'cinematic side key with gold rim light',
      direction: 'right',
      temperature: 'warm',
      brightness: 1.02,
      contrast: 1.04,
      shadowOpacity: 0.38,
      shadowBlur: 22,
    },
    compositionRules: { gravity: 'lower-third', floorY: 830 },
  },
  {
    name: 'Instagram Viral',
    slug: 'instagram-viral',
    description: 'Bright airy pastels with botanical props. Social media ready.',
    bestFor: 'Fashion, Cosmetics, Bags, Perfume',
    emoji: '📸',
    promptTemplate:
      'Bright airy lifestyle background plate only. Soft pastel tones, fresh flowers and botanical props ' +
      'arranged only near edges. Natural window light from left. Social commerce aesthetic. ' +
      'Empty center placement area with no product or object of any kind.',
    negativePrompt:
      'product, object, item, foreground, dark, gloomy, old fashioned, low quality, blurry, watermark, text, cartoon',
    thumbnailUrl: '',
    isActive: true,
    sceneType: 'bright social commerce lifestyle set',
    categoryCompatibility: ['fashion', 'cosmetics', 'bags', 'perfume', 'footwear'],
    lightingConfig: {
      name: 'airy natural soft light',
      direction: 'left',
      temperature: 'warm',
      brightness: 1.05,
      contrast: 1.02,
      shadowOpacity: 0.16,
      shadowBlur: 36,
    },
    compositionRules: { gravity: 'center', floorY: 815 },
  },
  {
    name: 'Nike Style',
    slug: 'nike-style',
    description: 'Dark athletic studio with dramatic lighting and reflective floor.',
    bestFor: 'Footwear, Sportswear, Bags',
    emoji: '💪',
    promptTemplate:
      'Bold high-contrast athletic studio backdrop only. Dark premium floor with reflective sheen. ' +
      'Hard dramatic side lighting casting sharp shadows. Energetic sports-brand atmosphere. ' +
      'Empty reflective floor with absolutely no footwear, shoes, or object of any kind.',
    negativePrompt:
      'product, object, shoes, footwear, item, soft lighting, pastel, plain white, low energy, cartoon, low quality, blurry, watermark',
    thumbnailUrl: '',
    isActive: true,
    sceneType: 'athletic high contrast studio',
    categoryCompatibility: ['footwear', 'fashion', 'bags'],
    lightingConfig: {
      name: 'dramatic athletic key light',
      direction: 'left',
      temperature: 'neutral',
      brightness: 1.03,
      contrast: 1.05,
      shadowOpacity: 0.40,
      shadowBlur: 20,
    },
    compositionRules: { gravity: 'lower-third', floorY: 790 },
  },
  {
    name: 'Nature Organic',
    slug: 'nature-organic',
    description: 'Earthy wood and botanical props. Eco and wellness vibe.',
    bestFor: 'Cosmetics, Fashion, Furniture',
    emoji: '🌿',
    promptTemplate:
      'Natural organic background plate only. Rustic warm wood or stone surface. ' +
      'Dappled golden-hour sunlight. Fresh green leaves arranged only near edges. ' +
      'Soft earthy eco-friendly mood. Empty surface center with no product or object of any kind.',
    negativePrompt:
      'product, object, item, foreground, artificial, synthetic, dark, gloomy, low quality, blurry, cartoon, watermark',
    thumbnailUrl: '',
    isActive: true,
    sceneType: 'organic natural daylight surface',
    categoryCompatibility: ['cosmetics', 'fashion', 'furniture', 'bags'],
    lightingConfig: {
      name: 'dappled warm daylight',
      direction: 'left',
      temperature: 'warm',
      brightness: 1.03,
      contrast: 1.02,
      shadowOpacity: 0.22,
      shadowBlur: 38,
    },
    compositionRules: { gravity: 'lower-third', floorY: 840 },
  },
  {
    name: 'Fashion Model',
    slug: 'fashion-model',
    description: 'Clean boutique studio floor ready for fashion compositing.',
    bestFor: 'Clothing, Saree, Bags, Footwear',
    emoji: '👗',
    promptTemplate:
      'Premium fashion studio background plate only. White or warm grey seamless sweep. ' +
      'Soft full-body directional studio lighting. Clean empty vertical composition area. ' +
      'Boutique editorial photography atmosphere. Smooth reflective floor. ' +
      'Absolutely no person, mannequin, clothing, garment, jeans, shirt, or object of any kind.',
    negativePrompt:
      'person, human, mannequin, body, clothing, jeans, pants, shirt, dress, fashion item, duplicate product, watermark, text, low quality, blurry',
    thumbnailUrl: '',
    isActive: true,
    sceneType: 'fashion editorial studio background',
    categoryCompatibility: ['fashion', 'saree', 'bags', 'footwear'],
    lightingConfig: {
      name: 'soft fashion full-body studio lighting',
      direction: 'front',
      temperature: 'neutral',
      brightness: 1.03,
      contrast: 1.02,
      shadowOpacity: 0.20,
      shadowBlur: 34,
    },
    compositionRules: { gravity: 'bottom', floorY: 900 },
  },
  {
    name: 'Jewelry Premium',
    slug: 'jewelry-premium',
    description: 'Black velvet macro with sparkle highlights. For rings, watches, jewelry.',
    bestFor: 'Jewelry, Watch',
    emoji: '💍',
    promptTemplate:
      'Ultra-luxury black velvet macro photography surface background plate only. ' +
      'Controlled sparkle specular highlights. Deep rich dark background with subtle bokeh depth. ' +
      'Premium jeweler showcase atmosphere. Empty velvet surface. ' +
      'Absolutely no ring, necklace, bracelet, earring, gemstone, watch, or jewelry of any kind.',
    negativePrompt:
      'ring, jewelry, gemstone, necklace, bracelet, earring, watch, duplicate product, watermark, text, low quality, blurry',
    thumbnailUrl: '',
    isActive: true,
    sceneType: 'luxury jewelry macro surface',
    categoryCompatibility: ['jewelry', 'watch'],
    lightingConfig: {
      name: 'controlled macro sparkle lighting',
      direction: 'right',
      temperature: 'neutral',
      brightness: 1.01,
      contrast: 1.02,
      shadowOpacity: 0.44,
      shadowBlur: 16,
    },
    compositionRules: { gravity: 'center', floorY: 760 },
  },
  {
    name: 'Tech Commercial',
    slug: 'tech-commercial',
    description: 'Minimal futuristic studio with cool geometric lighting.',
    bestFor: 'Electronics, Gadgets',
    emoji: '💻',
    promptTemplate:
      'Minimal futuristic technology studio background plate only. ' +
      'Clean slate grey or white matte surface. Cool LED accent lights creating geometric shadows. ' +
      'Precision Apple-style commercial photography aesthetic. ' +
      'Empty product placement surface with absolutely no phone, laptop, device, gadget, or electronics of any kind.',
    negativePrompt:
      'phone, laptop, electronics, gadget, device, product, object, duplicate product, watermark, text, low quality, blurry',
    thumbnailUrl: '',
    isActive: true,
    sceneType: 'minimal futuristic tech studio',
    categoryCompatibility: ['electronics'],
    lightingConfig: {
      name: 'cool tech strip lighting',
      direction: 'top',
      temperature: 'cool',
      brightness: 1.02,
      contrast: 1.03,
      shadowOpacity: 0.24,
      shadowBlur: 26,
    },
    compositionRules: { gravity: 'center', floorY: 800 },
  },
  {
    name: 'Furniture Room',
    slug: 'furniture-room',
    description: 'Modern Scandinavian interior with natural window light.',
    bestFor: 'Furniture, Home Decor',
    emoji: '🪑',
    promptTemplate:
      'Modern Scandinavian interior room background plate only. ' +
      'Realistic hardwood floor. Large natural window casting soft warm daylight. ' +
      'Architectural interior photography mood, neutral walls. ' +
      'Open empty floor area with absolutely no furniture, chair, sofa, table, or object of any kind.',
    negativePrompt:
      'chair, sofa, table, bed, furniture, object, product, duplicate product, watermark, text, low quality, blurry',
    thumbnailUrl: '',
    isActive: true,
    sceneType: 'modern interior room',
    categoryCompatibility: ['furniture'],
    lightingConfig: {
      name: 'large natural window light',
      direction: 'left',
      temperature: 'warm',
      brightness: 1.02,
      contrast: 1.02,
      shadowOpacity: 0.28,
      shadowBlur: 40,
    },
    compositionRules: { gravity: 'bottom', floorY: 870 },
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const { default: AiStyle } = await import('../models/AiStyle');

    for (const style of defaultStyles) {
      const result = await AiStyle.findOneAndUpdate(
        { slug: style.slug },
        { $set: style },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Upserted style: "${result.name}" (${result._id})`);
    }

    const totalActive = await AiStyle.countDocuments({ isActive: true });
    console.log(`\n🎉 AI Styles seeded successfully! ${totalActive} active styles in DB.`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
