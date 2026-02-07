
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// Import models
import User from '../models/User';
import VendorAuth from '../models/VendorAuth';
import Store from '../models/Store';
import Category from '../models/Category';
import Product from '../models/Product';

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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/offer-buddy';

async function seed() {
    try {
        console.log('🌱 Starting vendor and product seeding...');

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const categories = await Category.find({});
        if (categories.length === 0) {
            console.error('❌ No categories found.');
            process.exit(1);
        }

        const findCat = (slug: string) => categories.find(c => c.slug === slug || c.slug.includes(slug)) || categories[0];

        const vendorsData = [
            {
                email: 'fresh@mart.com',
                shopName: 'Fresh Mart',
                desc: 'Daily fresh groceries and organic produce delivered to your doorstep.',
                catSlug: 'groceries',
                coords: [77.6200, 12.9300], // Koramangala
                address: '12 Green Street, Koramangala',
                city: 'Bangalore',
                products: [
                    {
                        title: 'Organic Red Apples',
                        desc: 'Fresh, juicy, and organic red apples directly from the farm.',
                        price: { original: 120, discounted: 100 },
                        offer: { type: 'discount', value: 20, description: 'Flat ₹20 off' },
                        image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=300&q=80'
                    },
                    {
                        title: 'Whole Wheat Bread',
                        desc: 'Freshly baked whole wheat bread, high in fiber.',
                        price: { original: 45, discounted: 40 },
                        offer: { type: 'discount', value: 11, description: '11% off' },
                        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80'
                    },
                    {
                        title: 'Farm Fresh Milk',
                        desc: 'Pure cow milk, pasteurized and homogenized.',
                        price: { original: 30, discounted: 28 },
                        offer: { type: 'discount', value: 2, description: 'Introductory Offer' },
                        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80'
                    }
                ]
            },
            {
                email: 'tech@zone.com',
                shopName: 'Tech Zone',
                desc: 'Your one-stop shop for the latest gadgets and accessories.',
                catSlug: 'electronics',
                coords: [77.5800, 12.9600], // Richmond Road
                address: '5 Richmond Circle',
                city: 'Bangalore',
                products: [
                    {
                        title: 'Wireless Noise Cancelling Headphones',
                        desc: 'Immersive sound quality with active noise cancellation.',
                        price: { original: 4999, discounted: 3499 },
                        offer: { type: 'percentage', value: 30, description: '30% off' },
                        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80'
                    },
                    {
                        title: 'Smart Fitness Band',
                        desc: 'Track your steps, heart rate, and sleep.',
                        price: { original: 2499, discounted: 1999 },
                        offer: { type: 'percentage', value: 20, description: '20% off' },
                        image: 'https://images.unsplash.com/photo-1557935728-e6d1eaed5540?auto=format&fit=crop&w=300&q=80'
                    },
                    {
                        title: 'Portable Bluetooth Speaker',
                        desc: 'Powerful sound in a compact design. 10 hours battery life.',
                        price: { original: 1599, discounted: 1299 },
                        offer: { type: 'flat', value: 300, description: 'Save ₹300' },
                        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=300&q=80'
                    }
                ]
            },
            {
                email: 'style@loft.com',
                shopName: 'Style Loft',
                desc: 'Trendy fashion for men and women.',
                catSlug: 'fashion',
                coords: [77.6400, 12.9800], // Indiranagar
                address: '80ft Road, Indiranagar',
                city: 'Bangalore',
                products: [
                    {
                        title: 'Classic Denim Jacket',
                        desc: 'Timeless denim jacket, perfect for any casual outfit.',
                        price: { original: 2999, discounted: 1499 },
                        offer: { type: 'percentage', value: 50, description: 'Flat 50% off' },
                        image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=300&q=80'
                    },
                    {
                        title: 'Running Shoes',
                        desc: 'Lightweight and comfortable running shoes.',
                        price: { original: 3500, discounted: 2800 },
                        offer: { type: 'percentage', value: 20, description: 'Season Sale' },
                        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'
                    },
                    {
                        title: 'Casual Cotton T-Shirt',
                        desc: 'Soft and breathable cotton t-shirt.',
                        price: { original: 999, discounted: 499 },
                        offer: { type: 'bogo', value: 0, description: 'Buy 1 Get 1 Free' },
                        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80'
                    }
                ]
            }
        ];

        console.log(`🏪 Creating ${vendorsData.length} new vendors with products...`);
        const passwordHash = await bcrypt.hash('vendor123', 10);

        for (const v of vendorsData) {
            // Check if exists
            let vendorAuth = await VendorAuth.findOne({ email: v.email.toLowerCase() });
            let store;

            if (vendorAuth) {
                console.log(`⚠️ Vendor ${v.email} exists. Creating/updating store...`);
                // If auth exists, try to find store
                store = await Store.findOne({ vendorId: vendorAuth._id });
            } else {
                // Create Auth
                vendorAuth = await VendorAuth.create({
                    email: v.email.toLowerCase(),
                    password: passwordHash,
                    role: 'vendor',
                    isVerified: true
                });
            }

            const category = findCat(v.catSlug);

            if (!store) {
                store = await Store.create({
                    vendorId: vendorAuth!._id,
                    shopName: v.shopName,
                    shopLogo: `https://ui-avatars.com/api/?name=${v.shopName.replace(' ', '+')}&background=random`,
                    shopDescription: v.desc,
                    category: category._id,
                    location: {
                        coordinates: { type: 'Point', coordinates: v.coords },
                        address: v.address,
                        city: v.city,
                        state: 'Karnataka',
                        country: 'India',
                        pincode: '560001',
                    },
                    contactInfo: { phone: '+91 9000000000', email: v.email },
                    isApproved: true,
                    isActive: true
                });
                console.log(`✅ Created Store: ${v.shopName}`);
            }

            // Create Products
            for (const p of v.products) {
                // Check if product exists for this vendor to avoid duplicates if run multiple times
                const existingProduct = await Product.findOne({ vendorId: store._id, title: p.title });
                if (existingProduct) continue;

                await Product.create({
                    vendorId: store._id,
                    category: category._id,
                    title: p.title,
                    description: p.desc,
                    images: [p.image],
                    price: {
                        original: p.price.original,
                        discounted: p.price.discounted,
                        currency: 'INR'
                    },
                    offer: {
                        type: p.offer.type,
                        value: p.offer.value,
                        description: p.offer.description,
                        validFrom: new Date(),
                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    },
                    stock: { available: true, quantity: 50 },
                    isActive: true,
                    isFeatured: Math.random() > 0.7, // Randomly feature some
                    tags: [category.name, 'Deal', 'Offer']
                });
            }
            console.log(`   📦 Added ${v.products.length} products to ${v.shopName}`);
        }

        console.log('\n🎉 Seeding completed!');
        console.log('Credentials:');
        vendorsData.forEach(v => console.log(`- ${v.email} / vendor123`));

    } catch (error) {
        console.error('❌ Error Seeding:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
