/**
 * Vendor API: Trigger Virtual Try-On for a product image
 * POST /api/vendor/products/ai-tryon
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/utils';
import { startVirtualTryOn } from '@/lib/services/ai-tryon.service';
import type { TryOnRequest } from '@/lib/services/ai-photography/virtual-tryon.service';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json(apiError('Unauthorized'), { status: 403 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        apiError('AI service is not configured (missing REPLICATE_API_TOKEN)'),
        { status: 503 }
      );
    }

    const body = await request.json() as TryOnRequest;
    const {
      productId,
      imageUrl,
      modelImageUrl,
      garmentDescription,
      vendorPreferences
    } = body;

    // Validate input
    if (!productId || !imageUrl || !modelImageUrl) {
      return NextResponse.json(
        apiError('productId, imageUrl, and modelImageUrl are required'),
        { status: 400 }
      );
    }

    // Run the AI pipeline
    const result = await startVirtualTryOn(
      {
        productId,
        imageUrl,
        modelImageUrl,
        garmentDescription,
        vendorPreferences
      },
      user.userId
    );

    return NextResponse.json(
      apiSuccess(result, 'Virtual try-on started. Poll the status endpoint.'),
      { status: 202 }
    );
  } catch (error: any) {
    console.error('[AI Try-On API] Error:', error);
    return NextResponse.json(
      apiError('AI Try-On failed: ' + error.message),
      { status: 500 }
    );
  }
}
