import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env');
  process.exit(1);
}

const StoreSchema = new mongoose.Schema({}, { strict: false });
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

async function runMigration() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    console.log('Updating stores without lastActive and isLocked fields...');

    const result = await Store.updateMany(
      {
        $or: [
          { lastActive: { $exists: false } },
          { isLocked: { $exists: false } }
        ]
      },
      {
        $set: {
          lastActive: new Date(),
          isLocked: false
        }
      }
    );

    console.log(`Migration completed. Modified ${result.modifiedCount} store(s).`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

runMigration();
