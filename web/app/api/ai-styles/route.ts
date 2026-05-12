/**
 * Public API: Get active AI Styles (accessible by any authenticated user / vendor)
 * GET  /api/ai-styles   → list all active styles
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AiStyle from '@/models/AiStyle';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const styles = await AiStyle.find({ isActive: true })
      .select('name slug thumbnailUrl promptTemplate')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(apiSuccess({ styles }));
  } catch (error: any) {
    return NextResponse.json(apiError('Failed to fetch AI styles: ' + error.message), { status: 500 });
  }
}
