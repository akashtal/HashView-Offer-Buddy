/**
 * Vendor API: Poll the status of an ongoing AI Try-On job
 * GET /api/vendor/products/ai-tryon/status?productId=...&entryId=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/utils';
import { checkTryOnStatus } from '@/lib/services/ai-tryon.service';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json(apiError('Unauthorized'), { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const entryId = searchParams.get('entryId');

    if (!productId || !entryId) {
      return NextResponse.json(apiError('productId and entryId are required'), { status: 400 });
    }

    const result = await checkTryOnStatus(productId, entryId, user.userId);

    return NextResponse.json(apiSuccess(result));
  } catch (error: any) {
    console.error('[AI Try-On Status API] Error:', error);
    return NextResponse.json(
      apiError('Failed to check AI Try-On status: ' + error.message),
      { status: 500 }
    );
  }
}
