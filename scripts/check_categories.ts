
import mongoose from 'mongoose';
import Category from '../models/Category';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/offer-buddy';

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        const cats = await Category.find({}, 'name image slug');
        console.log('Categories found:', cats.length);
        cats.forEach(c => {
            console.log(`- ${c.name}: ${c.image || 'MISSING'}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
check();
