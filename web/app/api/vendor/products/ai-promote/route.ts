/**
 * Vendor API: Promote an AI-enhanced image to the primary product images array
 * POST /api/vendor/products/ai-promote
 *
 * Body:
 *   productId    string
 *   enhancedUrl  string  — the Cloudinary URL to add to images[]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/utils';
import { promoteAiImage } from '@/lib/services/ai-product.service';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json(apiError('Unauthorized'), { status: 403 });
    }

    const { productId, enhancedUrl } = await request.json();
    if (!productId || !enhancedUrl) {
      return NextResponse.json(apiError('productId and enhancedUrl are required'), { status: 400 });
    }

    const images = await promoteAiImage(productId, enhancedUrl);

    return NextResponse.json(apiSuccess({ images }, 'Image promoted to product gallery'));
  } catch (error: any) {
    return NextResponse.json(apiError('Promotion failed: ' + error.message), { status: 500 });
  }
}
