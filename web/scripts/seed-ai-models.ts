/**
 * Seed AI Models into MongoDB for Virtual Try-On
 * Run: npm run seed:ai-models
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

const defaultModels = [
  {
    name: 'Emma - Female Upper Body',
    gender: 'female',
    bodySegment: 'upper_body',
    garmentCategories: ['upper_body'],
    imageUrl: 'https://images.pexels.com/photos/17360617/pexels-photo-17360617.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    thumbnailUrl: 'https://images.pexels.com/photos/17360617/pexels-photo-17360617.jpeg?auto=compress&cs=tinysrgb&w=220&h=260&fit=crop',
    description: 'Female upper-body reference for shirts, tops, blouses, kurtas, and jackets.',
    sortOrder: 10,
    isActive: true,
  },
  {
    name: 'Aarav - Male Upper Body',
    gender: 'male',
    bodySegment: 'upper_body',
    garmentCategories: ['upper_body'],
    imageUrl: 'https://images.pexels.com/photos/5412379/pexels-photo-5412379.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    thumbnailUrl: 'https://images.pexels.com/photos/5412379/pexels-photo-5412379.jpeg?auto=compress&cs=tinysrgb&w=220&h=260&fit=crop',
    description: 'Male upper-body reference for shirts, t-shirts, hoodies, sweaters, and jackets.',
    sortOrder: 20,
    isActive: true,
  },
  {
    name: 'Sophia - Female Lower Body',
    gender: 'female',
    bodySegment: 'lower_body',
    garmentCategories: ['lower_body'],
    imageUrl: 'https://images.pexels.com/photos/10479441/pexels-photo-10479441.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    thumbnailUrl: 'https://images.pexels.com/photos/10479441/pexels-photo-10479441.jpeg?auto=compress&cs=tinysrgb&w=220&h=260&fit=crop',
    description: 'Female lower-body reference for jeans, pants, trousers, skirts, and leggings.',
    sortOrder: 30,
    isActive: true,
  },
  {
    name: 'Liam - Male Lower Body',
    gender: 'male',
    bodySegment: 'lower_body',
    garmentCategories: ['lower_body'],
    imageUrl: 'https://images.pexels.com/photos/5412378/pexels-photo-5412378.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    thumbnailUrl: 'https://images.pexels.com/photos/5412378/pexels-photo-5412378.jpeg?auto=compress&cs=tinysrgb&w=220&h=260&fit=crop',
    description: 'Male lower-body reference for jeans, pants, trousers, joggers, and shorts.',
    sortOrder: 40,
    isActive: true,
  },
  {
    name: 'Maya - Female Full Body',
    gender: 'female',
    bodySegment: 'full_body',
    garmentCategories: ['upper_body', 'lower_body', 'dresses'],
    imageUrl: 'https://images.pexels.com/photos/4461037/pexels-photo-4461037.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    thumbnailUrl: 'https://images.pexels.com/photos/4461037/pexels-photo-4461037.jpeg?auto=compress&cs=tinysrgb&w=220&h=260&fit=crop',
    description: 'Female full-body reference for dresses, sarees, co-ord sets, and complete outfits.',
    sortOrder: 50,
    isActive: true,
  },
  {
    name: 'Noah - Male Full Body',
    gender: 'male',
    bodySegment: 'full_body',
    garmentCategories: ['upper_body', 'lower_body', 'dresses'],
    imageUrl: 'https://images.pexels.com/photos/20359830/pexels-photo-20359830.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    thumbnailUrl: 'https://images.pexels.com/photos/20359830/pexels-photo-20359830.jpeg?auto=compress&cs=tinysrgb&w=220&h=260&fit=crop',
    description: 'Male full-body reference for complete looks and long garments.',
    sortOrder: 60,
    isActive: true,
  },
];

const legacyModelNames = ['Emma (Female)', 'Sophia (Female)', 'Liam (Male)', 'Noah (Male)'];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const { default: AiModel } = await import('../models/AiModel');

    for (const model of defaultModels) {
      const result = await AiModel.findOneAndUpdate(
        { name: model.name },
        { $set: model },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Upserted AI model: "${result.name}" (${result._id})`);
    }

    const hiddenLegacy = await AiModel.updateMany(
      { name: { $in: legacyModelNames } },
      { $set: { isActive: false } }
    );

    if (hiddenLegacy.modifiedCount > 0) {
      console.log(`Hidden ${hiddenLegacy.modifiedCount} old close-up preset model(s).`);
    }

    const totalActive = await AiModel.countDocuments({ isActive: true });
    console.log(`\nAI Models seeded successfully. ${totalActive} active models in DB.`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
