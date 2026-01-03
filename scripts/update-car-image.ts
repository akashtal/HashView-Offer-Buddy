/**
 * Update Car Category Image
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import Category from '../models/Category';

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
        console.log('No .env file found');
    }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/offer-buddy';

async function updateCarImage() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const result = await Category.updateOne(
            { name: 'Car' },
            { $set: { image: '/category-images/category_car.png' } }
        );

        if (result.modifiedCount > 0) {
            console.log('✅ Updated Car category with new image');
        } else {
            console.log('ℹ️  Car category already has an image or was not found');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

updateCarImage();
