/**
 * Seed AI Models into MongoDB for Virtual Try-On
 * Run: npx tsx scripts/seed-ai-models.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

const defaultModels = [
  {
    name: 'Emma (Female)',
    gender: 'female',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop', // Beautiful fashion model placeholder
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop',
    isActive: true,
  },
  {
    name: 'Sophia (Female)',
    gender: 'female',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop', 
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    isActive: true,
  },
  {
    name: 'Liam (Male)',
    gender: 'male',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    isActive: true,
  },
  {
    name: 'Noah (Male)',
    gender: 'male',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    isActive: true,
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const { default: AiModel } = await import('../models/AiModel');

    // Optional: Clear existing models before seeding (commented out by default)
    // await AiModel.deleteMany({});

    for (const model of defaultModels) {
      const result = await AiModel.findOneAndUpdate(
        { name: model.name },
        { $set: model },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Upserted AI model: "${result.name}" (${result._id})`);
    }

    const totalActive = await AiModel.countDocuments({ isActive: true });
    console.log(`\n🎉 AI Models seeded successfully! ${totalActive} active models in DB.`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
