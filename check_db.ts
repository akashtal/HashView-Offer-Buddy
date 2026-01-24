import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
}

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");
        const productsCollection = mongoose.connection.db?.collection('products');
        if (!productsCollection) throw new Error("Collection not found");

        const total = await productsCollection.countDocuments();
        console.log(`Total Products in DB: ${total}`);

        if (total > 0) {
            const sample = await productsCollection.find({}).limit(3).toArray();
            console.log("Samples:", JSON.stringify(sample, null, 2));
        } else {
            console.log("No products found in DB.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
