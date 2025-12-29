/**
 * Seed Script for Offer Buddy
 * 
 * This script creates sample data for development/testing:
 * - Admin user
 * - Sample categories
 * - Sample vendors
 * - Sample products
 * 
 * Usage: npm run seed
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// Import models
import User from '../models/User';
import Vendor from '../models/Vendor';
import Product from '../models/Product';
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

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Vendor.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
    ]);

    // Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@offerbuddy.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
    });
    console.log('✅ Admin created:', admin.email);

    // Create Categories
    console.log('📁 Creating categories...');
    const categories = await Category.insertMany([
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'TVs, headphones, smart devices, gaming consoles',
        icon: 'fi fi-rr-smartphone',
        isActive: true,
        order: 1,
      },
      {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Decor, appliances, cookware, furniture',
        icon: 'fi fi-rr-home',
        isActive: true,
        order: 2,
      },
      {
        name: 'Clothing, Shoes & Jewelry',
        slug: 'clothing-shoes-jewelry',
        description: 'Apparel, footwear, fashion accessories, watches',
        icon: 'fi fi-rr-shopping-bag',
        isActive: true,
        order: 3,
      },
      {
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        description: 'Cosmetics, skincare, haircare, fragrances',
        icon: 'fi fi-rr-star',
        isActive: true,
        order: 4,
      },
      {
        name: 'Health & Household',
        slug: 'health-household',
        description: 'Wellness, household supplies, baby care',
        icon: 'fi fi-rr-heart',
        isActive: true,
        order: 5,
      },
      {
        name: 'Toys & Games',
        slug: 'toys-games',
        description: 'Board games, action figures, educational toys',
        icon: 'fi fi-rr-gamepad',
        isActive: true,
        order: 6,
      },
      {
        name: 'Books, Music, Movies & TV',
        slug: 'books-music-movies-tv',
        description: 'Print books, eBooks, CDs, vinyl',
        icon: 'fi fi-rr-book',
        isActive: true,
        order: 7,
      },
      {
        name: 'Pet Supplies',
        slug: 'pet-supplies',
        description: 'Food, toys, accessories for pets',
        icon: 'fi fi-rr-paw',
        isActive: true,
        order: 8,
      },
      {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Fitness equipment, camping gear, outdoor apparel',
        icon: 'fi fi-rr-football',
        isActive: true,
        order: 9,
      },
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // Create Sample Vendors
    console.log('🏪 Creating sample vendors...');

    // Vendor 1
    const vendorUser1 = await User.create({
      name: 'John Electronics',
      email: 'john@electronics.com',
      password: await bcrypt.hash('vendor123', 10),
      role: 'vendor',
      phone: '+91 9876543210',
    });

    const vendor1 = await Vendor.create({
      userId: vendorUser1._id,
      shopName: 'Tech Paradise',
      shopDescription: 'Your one-stop shop for all electronics needs',
      category: categories[0]._id,
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // Bangalore coordinates
        address: '123 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        pincode: '560001',
      },
      contactInfo: {
        phone: '+91 9876543210',
        whatsapp: '+919876543210',
        email: 'contact@techparadise.com',
      },
      isApproved: true,
      isActive: true,
    });

    // Vendor 2
    const vendorUser2 = await User.create({
      name: 'Sarah Fashion',
      email: 'sarah@fashion.com',
      password: await bcrypt.hash('vendor123', 10),
      role: 'vendor',
      phone: '+91 9876543211',
    });

    const vendor2 = await Vendor.create({
      userId: vendorUser2._id,
      shopName: 'Style Studio',
      shopDescription: 'Latest fashion trends at unbeatable prices',
      category: categories[1]._id,
      location: {
        type: 'Point',
        coordinates: [77.6033, 12.9797],
        address: '456 Brigade Road',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        pincode: '560025',
      },
      contactInfo: {
        phone: '+91 9876543211',
        whatsapp: '+919876543211',
        email: 'contact@stylestudio.com',
      },
      isApproved: true,
      isActive: true,
    });

    console.log('✅ Created sample vendors');

    // Create Sample Products
    console.log('📦 Creating sample products...');

    const products = await Product.insertMany([
      {
        vendorId: vendor1._id,
        title: 'Samsung Galaxy S23',
        description: 'Latest Samsung flagship phone with amazing camera and performance',
        images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500'],
        category: categories[0]._id,
        price: {
          original: 79999,
          discounted: 69999,
          currency: 'INR',
        },
        offer: {
          type: 'percentage',
          value: 12,
          description: '12% OFF + Free Earbuds',
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        tags: ['smartphone', 'samsung', 'android'],
        isActive: true,
        isFeatured: true,
      },
      {
        vendorId: vendor1._id,
        title: 'Dell XPS 15 Laptop',
        description: 'Powerful laptop for professionals with stunning display',
        images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500'],
        category: categories[0]._id,
        price: {
          original: 129999,
          discounted: 119999,
          currency: 'INR',
        },
        tags: ['laptop', 'dell', 'professional'],
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        title: 'Premium Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt in multiple colors',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
        category: categories[1]._id,
        price: {
          original: 999,
          discounted: 499,
          currency: 'INR',
        },
        offer: {
          type: 'bogo',
          description: 'Buy 1 Get 1 Free',
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        tags: ['t-shirt', 'cotton', 'casual'],
        isActive: true,
        isFeatured: true,
      },
      {
        vendorId: vendor2._id,
        title: 'Denim Jeans',
        description: 'Classic blue denim jeans with perfect fit',
        images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'],
        category: categories[1]._id,
        price: {
          original: 2499,
          discounted: 1999,
          currency: 'INR',
        },
        tags: ['jeans', 'denim', 'fashion'],
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${products.length} sample products`);

    // Update vendor product counts
    await Vendor.findByIdAndUpdate(vendor1._id, {
      $set: { 'analytics.totalProducts': 2 },
    });
    await Vendor.findByIdAndUpdate(vendor2._id, {
      $set: { 'analytics.totalProducts': 2 },
    });

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@offerbuddy.com / Admin@123');
    console.log('Vendor 1: john@electronics.com / vendor123');
    console.log('Vendor 2: sarah@fashion.com / vendor123\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();

