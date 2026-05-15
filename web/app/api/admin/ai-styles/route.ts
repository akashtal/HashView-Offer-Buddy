/**
 * Admin API: Manage AI Styles (AI Characters)
 * GET  /api/admin/ai-styles        → list all styles
 * POST /api/admin/ai-styles        → create a new style
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AiStyle from '@/models/AiStyle';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess, generateSlug } from '@/lib/utils';

// ── GET: list all styles (accessible to all authenticated users for the picker) ──
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') !== 'false';

    const styles = await AiStyle.find(activeOnly ? { isActive: true } : {})
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(apiSuccess({ styles }));
  } catch (error: any) {
    return NextResponse.json(apiError('Failed to fetch AI styles: ' + error.message), { status: 500 });
  }
}

// ── POST: create a new style (admin only) ──
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(apiError('Admin access required'), { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      promptTemplate,
      negativePrompt,
      thumbnailUrl,
      isActive,
      lightingConfig,
      sceneType,
      compositionRules,
      categoryCompatibility,
      generationTier,
    } = body;

    if (!name || !promptTemplate) {
      return NextResponse.json(apiError('name and promptTemplate are required'), { status: 400 });
    }

    const slug = generateSlug(name);

    const existing = await AiStyle.findOne({ slug });
    if (existing) {
      return NextResponse.json(apiError('A style with this name already exists'), { status: 409 });
    }

    const style = await AiStyle.create({
      name: name.trim(),
      slug,
      promptTemplate: promptTemplate.trim(),
      negativePrompt: negativePrompt?.trim() || '',
      thumbnailUrl: thumbnailUrl || '',
      lightingConfig: lightingConfig || {},
      sceneType: sceneType || '',
      compositionRules: compositionRules || {},
      categoryCompatibility: Array.isArray(categoryCompatibility) ? categoryCompatibility : [],
      generationTier: generationTier === 'premium' ? 'premium' : 'preview',
      isActive: isActive !== false,
    });

    return NextResponse.json(apiSuccess({ style }, 'AI Style created successfully'), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(apiError('Failed to create AI style: ' + error.message), { status: 500 });
  }
}
