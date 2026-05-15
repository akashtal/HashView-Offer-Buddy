import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AiModel from '@/models/AiModel';
import { apiError, apiSuccess } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const models = await AiModel.find({ isActive: true }).sort({ createdAt: 1 });
    
    return NextResponse.json(apiSuccess({ models }));
  } catch (error: any) {
    console.error('[AI Models API] Error fetching models:', error);
    return NextResponse.json(apiError('Failed to fetch AI models'), { status: 500 });
  }
}
