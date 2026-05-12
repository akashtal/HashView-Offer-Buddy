/**
 * Seed initial AI Styles (AI Characters) into the database.
 * Run: npx tsx scripts/seed-ai-styles.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

const defaultStyles = [
  {
    name: 'Amazon Clean',
    slug: 'amazon-clean',
    promptTemplate:
      'A professional product photograph of a {product} on a pure white background, soft diffused studio lighting, subtle drop shadow, no reflections, clean e-commerce style, highly detailed, 4K, photorealistic.',
    negativePrompt:
      'colorful background, noise, watermark, text, humans, hands, low quality, blurry, cartoon, illustration',
    thumbnailUrl: '',
    isActive: true,
  },
  {
    name: 'Luxury Gold',
    slug: 'luxury-gold',
    promptTemplate:
      'A high-end luxury product photo of a {product}, placed on a dark black marble surface, gold metallic accents in the background, cinematic dramatic lighting, bokeh, premium brand feel, ultra realistic, 8K resolution.',
    negativePrompt:
      'plain background, cheap, cartoon, illustration, low quality, blurry, watermark, text',
    thumbnailUrl: '',
    isActive: true,
  },
  {
    name: 'Instagram Viral',
    slug: 'instagram-viral',
    promptTemplate:
      'A trendy lifestyle product shot of a {product}, bright airy natural light, pastel tones, flat-lay composition, flowers and props around it, social media aesthetic, vibrant, millennial pink, shot on iPhone pro, photorealistic.',
    negativePrompt:
      'dark, gloomy, old fashioned, low quality, blurry, watermark, text, cartoon',
    thumbnailUrl: '',
    isActive: true,
  },
  {
    name: 'Nike Style',
    slug: 'nike-style',
    promptTemplate:
      'A bold dynamic product photo of a {product}, high contrast studio lighting, dramatic hard shadows, dark background, athletic and sporty feel, professional Nike-style product photography, 4K ultra sharp, photorealistic.',
    negativePrompt:
      'soft lighting, pastel, plain white, low energy, cartoon, low quality, blurry, watermark',
    thumbnailUrl: '',
    isActive: true,
  },
  {
    name: 'Nature Organic',
    slug: 'nature-organic',
    promptTemplate:
      'A natural lifestyle product photo of a {product} on a rustic wooden surface, surrounded by green leaves and earthy textures, soft dappled sunlight filtering through, organic and eco-friendly feel, warm tones, highly detailed, photorealistic.',
    negativePrompt:
      'artificial, synthetic, dark, gloomy, low quality, blurry, cartoon, watermark, text',
    thumbnailUrl: '',
    isActive: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Dynamic import to avoid circular dependency issues in CommonJS
    const { default: AiStyle } = await import('../models/AiStyle');

    for (const style of defaultStyles) {
      const existing = await AiStyle.findOne({ slug: style.slug });
      if (existing) {
        console.log(`⏭️  Skipping "${style.name}" (already exists)`);
        continue;
      }
      await AiStyle.create(style);
      console.log(`✅ Created style: "${style.name}"`);
    }

    console.log('\n🎉 AI Styles seeded successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
