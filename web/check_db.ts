import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
}

// Import User model (adjust path if needed, assuming check_db.ts is in root)
import User from './models/User';
import bcrypt from 'bcryptjs';

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB:", mongoose.connection.db?.databaseName);

        // Check and Create Admin
        const adminEmail = 'admin@offerbuddy.com';
        const adminPassword = 'Admin@123';

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            console.log("⚠️ Admin user not found. Creating default admin...");
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await User.create({
                name: 'Admin User',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
            });
            console.log(`✅ Admin created successfully: ${adminEmail} / ${adminPassword}`);
        } else {
            console.log("✅ Admin user already exists.");
        }

        const productsCollection = mongoose.connection.db?.collection('products');
        if (!productsCollection) {
            console.log("Products collection not initialized yet.");
        } else {
            const total = await productsCollection.countDocuments();
            console.log(`Total Products in DB: ${total}`);
            if (total > 0) {
                const sample = await productsCollection.find({}).limit(3).toArray();
                console.log("Samples:", JSON.stringify(sample, null, 2));
            } else {
                console.log("No products found in DB.");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
