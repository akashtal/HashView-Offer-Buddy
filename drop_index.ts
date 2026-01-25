
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
}

async function dropEmailIndex() {
    try {
        const conn = await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // Access the native MongoDB driver collection
        const collection = conn.connection.collection('users');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        // Look for the index with key { email: 1 } and name 'email_1'
        const emailIndex = indexes.find(idx => idx.name === 'email_1');

        if (emailIndex) {
            console.log('Found legacy email index. Dropping...');
            await collection.dropIndex(emailIndex.name as string);
            console.log('Successfully dropped index:', emailIndex.name);
        } else {
            console.log('No legacy unique email index found.');
        }

    } catch (error) {
        console.error('Error dropping index:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

dropEmailIndex();
