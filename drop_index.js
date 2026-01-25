
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
}

async function dropEmailIndex() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('users');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        // Look for the unique email index: either named 'email_1' or key pattern { email: 1 } unique: true
        const emailIndex = indexes.find(idx => idx.name === 'email_1');

        if (emailIndex) {
            console.log('Found legacy email index. Dropping...');
            await collection.dropIndex(emailIndex.name);
            console.log('Successfully dropped index:', emailIndex.name);
        } else {
            console.log('No legacy unique email index found.');
        }

        // List updated indexes
        const updatedIndexes = await collection.indexes();
        console.log('Updated indexes:', updatedIndexes);

    } catch (error) {
        console.error('Error dropping index:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

dropEmailIndex();
