
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// Import models
import User from '../models/User';
import VendorAuth from '../models/VendorAuth';
import Store from '../models/Store';
import Category from '../models/Category';

// Load .env file manually
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
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
        }
    } catch (error) {
        console.log('No .env file found, using default connection');
    }
}

loadEnv();

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/offer-buddy';

async function createVendors() {
    try {
        console.log('🌱 Starting vendor creation script...');

        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get Categories
        const categories = await Category.find({});
        if (categories.length === 0) {
            console.error('❌ No categories found. Please run seed script or add categories first.');
            process.exit(1);
        }

        // Helper to find category by slug or name
        const findCat = (slug: string) => categories.find(c => c.slug === slug || c.slug.includes(slug)) || categories[0];

        const vendorsToCreate = [
            {
                email: 'electronics@cityservice.com',
                shopName: 'City Electronics Hub',
                desc: 'Authorized service and sales for all major electronic brands.',
                catSlug: 'electronics',
                coords: [77.5946, 12.9716], // Bangalore
                address: '42 MG Road',
                city: 'Bangalore'
            },
            {
                email: 'decor@modernliving.com',
                shopName: 'Modern Living Decor',
                desc: 'Modern furniture and home decor for your urban lifestyle.',
                catSlug: 'home-kitchen',
                coords: [77.6033, 12.9797], // Indiranagar
                address: '100 Feet Road, Indiranagar',
                city: 'Bangalore'
            },
            {
                email: 'toys@kidskingdom.com',
                shopName: 'Kids Kingdom',
                desc: 'The best collection of educational toys and games for all ages.',
                catSlug: 'toys-games',
                coords: [77.6101, 12.9345], // Koramangala
                address: '88 5th Block, Koramangala',
                city: 'Bangalore'
            },
            {
                email: 'books@booknook.com',
                shopName: 'The Book Nook',
                desc: 'A cozy place for book lovers with a wide collection of genres.',
                catSlug: 'books-music-movies-tv',
                coords: [77.5806, 12.9806], // Malleshwaram
                address: '15 Sampige Road, Malleshwaram',
                city: 'Bangalore'
            },
            {
                email: 'beauty@glamour.com',
                shopName: 'Glamour Beauty Store',
                desc: 'Premium beauty and personal care products for you.',
                catSlug: 'beauty-personal-care',
                coords: [77.6366, 12.9141], // HSR Layout
                address: '27th Main, HSR Layout',
                city: 'Bangalore'
            }
        ];

        console.log(`🏪 creating ${vendorsToCreate.length} new vendors...`);

        const passwordHash = await bcrypt.hash('vendor123', 10);
        const createdVendors = [];

        for (const v of vendorsToCreate) {
            // Check if vendor email already exists
            const existingAuth = await VendorAuth.findOne({ email: v.email.toLowerCase() });
            if (existingAuth) {
                console.log(`⚠️ Vendor ${v.email} already exists, skipping.`);
                continue;
            }

            const category = findCat(v.catSlug);

            // Create Auth
            const vendorAuth = await VendorAuth.create({
                email: v.email.toLowerCase(),
                password: passwordHash,
                role: 'vendor',
                isVerified: true
            });

            // Create Store
            const store = await Store.create({
                vendorId: vendorAuth._id,
                shopName: v.shopName,
                shopDescription: v.desc,
                category: category._id,
                location: {
                    coordinates: {
                        type: 'Point',
                        coordinates: v.coords,
                    },
                    address: v.address,
                    city: v.city,
                    state: 'Karnataka',
                    country: 'India',
                    pincode: '560001',
                },
                contactInfo: {
                    phone: '+91 9000000000',
                    email: v.email,
                },
                isApproved: true,
                isActive: true,
                analytics: {
                    totalProducts: 0,
                    totalViews: 0,
                    averageRating: 0
                }
            });

            createdVendors.push({
                name: v.shopName,
                email: v.email,
                id: store._id
            });
            console.log(`✅ Created: ${v.shopName} (${v.email})`);
        }

        console.log('\n🎉 Vendor creation completed!');
        if (createdVendors.length > 0) {
            console.log('\n📝 New Vendor Credentials (Password: vendor123):');
            createdVendors.forEach(v => {
                console.log(`- ${v.name}: ${v.email}`);
            });
        } else {
            console.log('No new vendors were created (they might already exist).');
        }

    } catch (error) {
        console.error('❌ Error creating vendors:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

createVendors();
