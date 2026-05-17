import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/utils';
import { checkEnhancementStatus } from '@/lib/services/ai-product.service';

export const runtime = 'nodejs';
export const maxDuration = 300;

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
      return NextResponse.json(
        apiError('productId and entryId are required query parameters'),
        { status: 400 }
      );
    }

    const result = await checkEnhancementStatus(productId, entryId, user.userId);

    return NextResponse.json(apiSuccess(result, 'Status fetched'), { status: 200 });
  } catch (error: any) {
    console.error('[AI Enhance Status API] Error:', error);
    return NextResponse.json(
      apiError('Failed to check enhancement status: ' + error.message),
      { status: 500 }
    );
  }
}
