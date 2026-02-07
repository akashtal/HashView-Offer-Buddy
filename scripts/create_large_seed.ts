
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

// Load .env
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
        console.log('No .env file found');
    }
}

loadEnv();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/offer-buddy';

// Sample Data Generators
const storeAdjectives = ['Super', 'Mega', 'Quick', 'Smart', 'Best', 'Top', 'Prime', 'Elite', 'Urban', 'Royal'];
const storeNouns = ['Mart', 'Store', 'Shop', 'Outlet', 'Bazaar', 'Market', 'Hub', 'Plaza', 'Center', 'World'];
const locations = [
    { name: 'Koramangala', coords: [77.6200, 12.9300] },
    { name: 'Indiranagar', coords: [77.6400, 12.9800] },
    { name: 'Whitefield', coords: [77.7499, 12.9698] },
    { name: 'Jayanagar', coords: [77.5800, 12.9250] },
    { name: 'HSR Layout', coords: [77.6366, 12.9141] },
    { name: 'Malleshwaram', coords: [77.5700, 13.0000] },
    { name: 'JP Nagar', coords: [77.5900, 12.9100] },
    { name: 'Electronic City', coords: [77.6600, 12.8400] },
    { name: 'Marathahalli', coords: [77.6900, 12.9500] },
    { name: 'BTM Layout', coords: [77.6100, 12.9165] }
];

const productAdjectives = ['Premium', 'Deluxe', 'Organic', 'Fresh', 'New', 'Vintage', 'Classic', 'Modern', 'Elegant', 'Handcrafted', 'Durable', 'Exclusive'];
const productNouns = {
    electronics: ['Smartphone', 'Laptop', 'Headphones', 'Smartwatch', 'Speaker', 'Tablet', 'Camera', 'Printer', 'Monitor', 'Keyboard'],
    fashion: ['T-Shirt', 'Jeans', 'Jacket', 'Dress', 'Sneakers', 'Watch', 'Handbag', 'Sunglasses', 'Hat', 'Scarf'],
    groceries: ['Apples', 'Bread', 'Milk', 'Cheese', 'Coffee', 'Tea', 'Rice', 'Pasta', 'Spices', 'Honey'],
    furniture: ['Chair', 'Table', 'Sofa', 'Bed', 'Desk', 'Lamp', 'Bookshelf', 'Cabinet', 'Rug', 'Mirror']
};

const images = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1593642632823-8f78536788c6?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=300&q=80'
];

function getRandom(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrice(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function seedLarge() {
    try {
        console.log('🌱 Starting LARGE DataSet Seeding (10 Vendors, 200+ Products)...');
        await mongoose.connect(MONGODB_URI);

        const categories = await Category.find({});
        if (categories.length === 0) throw new Error('No categories found');

        const passwordHash = await bcrypt.hash('vendor123', 10);
        let vendorCount = 0;
        let productCount = 0;

        for (let i = 1; i <= 10; i++) {
            // Generate Vendor
            const loc = getRandom(locations);
            const adj = getRandom(storeAdjectives);
            const noun = getRandom(storeNouns);
            const shopName = `${adj} ${noun} ${i}`;
            const email = `vendor${Date.now()}_${i}@example.com`; // Unique email
            const category = getRandom(categories);
            const catSlug = category.slug;

            // Determine product type based on category roughly
            let prodType = 'groceries'; // default
            if (catSlug.includes('elect')) prodType = 'electronics';
            else if (catSlug.includes('fash')) prodType = 'fashion';
            else if (catSlug.includes('home')) prodType = 'furniture';

            // Create Auth
            const vendorAuth = await VendorAuth.create({
                email,
                password: passwordHash,
                role: 'vendor',
                isVerified: true
            });

            // Create Store
            const store = await Store.create({
                vendorId: vendorAuth._id,
                shopName,
                shopLogo: `https://ui-avatars.com/api/?name=${shopName.replace(/ /g, '+')}&background=random&size=200`,
                shopDescription: `The best place for ${prodType} in ${loc.name}.`,
                category: category._id,
                location: {
                    coordinates: { type: 'Point', coordinates: loc.coords },
                    address: `Shop #${getRandomPrice(1, 999)}, ${loc.name} Main Road`,
                    city: 'Bangalore',
                    state: 'Karnataka',
                    country: 'India',
                    pincode: '560001'
                },
                contactInfo: { phone: `+91 ${getRandomPrice(9000000000, 9999999999)}`, email },
                isApproved: true,
                isActive: true,
                rating: getRandomPrice(35, 50) / 10,
                analytics: {
                    totalProducts: 20,
                    totalViews: getRandomPrice(100, 5000),
                    totalContacts: getRandomPrice(10, 500)
                }
            });

            vendorCount++;
            console.log(`🏪 Created Vendor: ${shopName}`);

            // Create 20-25 Products for this vendor
            const numProducts = getRandomPrice(20, 25);
            const productList = productNouns[prodType as keyof typeof productNouns] || productNouns['groceries'];

            const productPromises = [];
            for (let j = 0; j < numProducts; j++) {
                const pNoun = getRandom(productList);
                const pAdj = getRandom(productAdjectives);
                const title = `${pAdj} ${pNoun}`;
                const originalPrice = getRandomPrice(500, 50000);
                const discount = getRandomPrice(10, 60);
                const discountedPrice = originalPrice - (originalPrice * discount / 100);

                productPromises.push(Product.create({
                    vendorId: store._id,
                    category: category._id,
                    title,
                    description: `High quality ${title} available now at ${shopName}. Limited stock!`,
                    images: [getRandom(images), getRandom(images)], // 2 random images
                    price: {
                        original: originalPrice,
                        discounted: Math.floor(discountedPrice),
                        currency: 'INR'
                    },
                    offer: {
                        type: 'percentage',
                        value: discount,
                        description: `${discount}% OFF`,
                        validFrom: new Date(),
                        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                    },
                    stock: { available: true, quantity: getRandomPrice(5, 100) },
                    isActive: true,
                    isFeatured: Math.random() > 0.8,
                    tags: [category.name, pNoun, 'Best Seller'],
                    analytics: {
                        views: getRandomPrice(50, 1000),
                        contacts: getRandomPrice(5, 100)
                    }
                }));
            }

            await Promise.all(productPromises);
            productCount += numProducts;
            console.log(`   📦 Added ${numProducts} products`);
        }

        console.log(`\n🎉 SUCCESS! Created ${vendorCount} vendors and ${productCount} products.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

seedLarge();
