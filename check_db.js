const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
}

mongoose.connect(MONGODB_URI).then(async () => {
    console.log("Connected to DB");
    const productsCollection = mongoose.connection.db.collection('products');
    const total = await productsCollection.countDocuments();
    console.log(`Total Products in DB: ${total}`);

    if (total > 0) {
        const sample = await productsCollection.find({}).limit(3).toArray();
        console.log("Samples:", JSON.stringify(sample, null, 2));
    } else {
        console.log("No products found in DB.");
    }

    process.exit(0);
}).catch(err => {
    console.error("DB Connection Error:", err);
    process.exit(1);
});
