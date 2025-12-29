import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/offer-buddy';

async function cleanDb() {
    try {
        console.log('🧹 Connectng to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        const collections = await mongoose.connection.db!.collections();

        if (collections.length === 0) {
            console.log('✨ Database is already empty.');
            return;
        }

        console.log(`🗑️  Found ${collections.length} collections. Cleaning...`);

        for (const collection of collections) {
            const name = collection.collectionName;
            // Skip system collections if any
            if (name.startsWith('system.')) continue;

            const count = await collection.countDocuments();
            if (count > 0) {
                await collection.deleteMany({});
                console.log(`   - Cleared '${name}' (${count} docs)`);
            } else {
                console.log(`   - '${name}' was empty`);
            }
        }

        console.log('✨ Database cleanup complete!');

    } catch (error) {
        console.error('❌ Error cleaning database:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

cleanDb();
