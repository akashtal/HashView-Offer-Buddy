
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
    try {
        await dbConnect();
        const collection = mongoose.connection.collection('users');

        // Check indexes
        const indexes = await collection.indexes();
        const emailIndex = indexes.find(idx => idx.name === 'email_1');

        if (emailIndex) {
            await collection.dropIndex('email_1');
            return NextResponse.json({ message: 'Dropped email_1 index', indexes });
        }

        return NextResponse.json({ message: 'Index not found', indexes });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
