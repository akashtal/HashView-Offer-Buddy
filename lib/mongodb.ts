import mongoose from 'mongoose';


const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log('✅ MongoDB connected successfully');

      // Auto-create Admin User
      try {
        // Dynamic import to avoid circular dependency issues during initialization
        const { default: User } = await import('@/models/User');
        const bcrypt = (await import('bcryptjs')).default;

        const adminEmail = 'admin@offerbuddy.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
          console.log('⚙️  Auto-seeding Admin User...');
          const hashedPassword = await bcrypt.hash('Admin@123', 10);
          await User.create({
            name: 'Admin User',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            isVerified: true,
          });
          console.log('✅ Default Admin created: admin@offerbuddy.com');
        }
      } catch (error) {
        console.error('❌ Failed to auto-seed admin:', error);
      }

      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
