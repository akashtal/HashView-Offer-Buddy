/**
 * Vendor API: Trigger AI image enhancement for a product image
 * POST /api/vendor/products/ai-enhance
 *
 * Body:
 *   productId      string  — the product to attach the result to
 *   imageUrl       string  — Cloudinary URL of the uploaded product image
 *   mode           'style' | 'custom-scene'
 *   styleId?       string  — required when mode === 'style'
 *   customSceneUrl? string — required when mode === 'custom-scene'
 *   productName?   string  — used to personalise the AI prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/utils';
import { enhanceProductImage, EnhanceRequest } from '@/lib/services/ai-product.service';

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

    const body = await request.json() as EnhanceRequest;
    const {
      productId,
      imageUrl,
      mode,
      styleId,
      customSceneUrl,
      productName,
      vendorModelReferenceUrl,
      generationQuality,
      vendorPreferences,
      lightingType,
    } = body;

    // Validate input
    if (!productId || !imageUrl || !mode) {
      return NextResponse.json(
        apiError('productId, imageUrl, and mode are required'),
        { status: 400 }
      );
    }
    if (generationQuality && !['preview', 'premium'].includes(generationQuality)) {
      return NextResponse.json(apiError('generationQuality must be "preview" or "premium"'), { status: 400 });
    }
    if (mode === 'custom-scene' && !customSceneUrl && !vendorModelReferenceUrl) {
      return NextResponse.json(
        apiError('customSceneUrl or vendorModelReferenceUrl is required when mode is "custom-scene"'),
        { status: 400 }
      );
    }

    const requestPayload: EnhanceRequest = {
      productId,
      imageUrl,
      mode,
      styleId,
      customSceneUrl,
      productName,
      vendorModelReferenceUrl,
      generationQuality: generationQuality || (process.env.AI_DEFAULT_QUALITY as 'preview' | 'premium' | undefined) || 'preview',
      vendorPreferences,
      lightingType,
    };

    const result = await enhanceProductImage(requestPayload, user.userId);

    return NextResponse.json(
      apiSuccess(result, 'Image enhancement started. Poll the status endpoint.'),
      { status: 202 }
    );
  } catch (error: any) {
    console.error('[AI Enhance API] Error:', error);
    return NextResponse.json(
      apiError('AI enhancement failed: ' + error.message),
      { status: 500 }
    );
  }
}
