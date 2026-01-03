/**
 * Add Category Images Script
 * 
 * This script adds images to categories in the database.
 * Mix of AI-generated and real product images.
 * 
 * Usage: npx tsx scripts/add-category-images.ts
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Import models
import Category from '../models/Category';

// Load .env file manually
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim();
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            }
        });
    } catch (error) {
        console.log('No .env file found, using default connection');
    }
}

loadEnv();

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/offer-buddy';

// Category images mapping
const categoryImages = {
    'Electronics': {
        image: '/category-images/category_electronics_1767451867257.png',
        type: 'generated'
    },
    'Home & Kitchen': {
        image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80',
        type: 'real'
    },
    'Clothing, Shoes & Jewelry': {
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
        type: 'real'
    },
    'Beauty & Personal Care': {
        image: '/category-images/category_beauty_care_1767451998286.png',
        type: 'generated'
    },
    'Health & Household': {
        image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
        type: 'real'
    },
    'Toys & Games': {
        image: '/category-images/category_toys_games_1767451971698.png',
        type: 'generated'
    },
    'Books, Music, Movies & TV': {
        image: '/category-images/category_books_music_1767451926221.png',
        type: 'generated'
    },
    'Pet Supplies': {
        image: '/category-images/category_pet_supplies_1767452030501.png',
        type: 'generated'
    },
    'Sports & Outdoors': {
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
        type: 'real'
    }
};

async function addCategoryImages() {
    try {
        console.log('🖼️  Adding category images...');

        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create backup of current state
        const currentCategories = await Category.find({}).select('name image');
        const backupPath = path.join(process.cwd(), 'scripts', 'category-backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(currentCategories, null, 2));
        console.log('✅ Created backup at scripts/category-backup.json');

        // Update categories with images
        let updatedCount = 0;
        for (const [categoryName, imageData] of Object.entries(categoryImages)) {
            const result = await Category.updateOne(
                { name: categoryName },
                { $set: { image: imageData.image } }
            );

            if (result.modifiedCount > 0) {
                updatedCount++;
                console.log(`✅ Updated ${categoryName} with ${imageData.type} image`);
            }
        }

        console.log(`\n🎉 Successfully updated ${updatedCount} categories with images!`);
        console.log('\n📝 To revert changes, run: npm run revert-category-images\n');

    } catch (error) {
        console.error('❌ Error adding category images:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

addCategoryImages();
