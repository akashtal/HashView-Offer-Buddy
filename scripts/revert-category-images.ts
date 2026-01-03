/**
 * Revert Category Images Script
 * 
 * This script removes all category images and reverts to icon-based display.
 * Uses the backup created by add-category-images.ts
 * 
 * Usage: npx tsx scripts/revert-category-images.ts
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

async function revertCategoryImages() {
    try {
        console.log('🔄 Reverting category images...');

        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Remove all category images
        const result = await Category.updateMany(
            {},
            { $unset: { image: "" } }
        );

        console.log(`✅ Removed images from ${result.modifiedCount} categories`);

        // Delete generated image files (optional - keeps backup)
        const categoryImagesDir = path.join(process.cwd(), 'public', 'category-images');
        if (fs.existsSync(categoryImagesDir)) {
            const files = fs.readdirSync(categoryImagesDir);
            files.forEach(file => {
                if (file.startsWith('category_') && file.endsWith('.png')) {
                    fs.unlinkSync(path.join(categoryImagesDir, file));
                    console.log(`🗑️  Deleted ${file}`);
                }
            });
        }

        console.log('\n🎉 Successfully reverted all changes!');
        console.log('✅ Categories now use icon-based display');
        console.log('✅ Generated image files deleted\n');

    } catch (error) {
        console.error('❌ Error reverting category images:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

revertCategoryImages();
