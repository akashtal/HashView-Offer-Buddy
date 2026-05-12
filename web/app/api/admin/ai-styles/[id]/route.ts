/**
 * Admin API: Update / Delete a single AI Style
 * PATCH  /api/admin/ai-styles/[id]   → update
 * DELETE /api/admin/ai-styles/[id]   → soft delete (set isActive = false)
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AiStyle from '@/models/AiStyle';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess, generateSlug } from '@/lib/utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(apiError('Admin access required'), { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { name, promptTemplate, negativePrompt, thumbnailUrl, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) { updateData.name = name.trim(); updateData.slug = generateSlug(name); }
    if (promptTemplate !== undefined) updateData.promptTemplate = promptTemplate.trim();
    if (negativePrompt !== undefined) updateData.negativePrompt = negativePrompt.trim();
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const style = await AiStyle.findByIdAndUpdate(params.id, updateData, { new: true });
    if (!style) return NextResponse.json(apiError('Style not found'), { status: 404 });

    return NextResponse.json(apiSuccess({ style }, 'AI Style updated'));
  } catch (error: any) {
    return NextResponse.json(apiError('Update failed: ' + error.message), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(apiError('Admin access required'), { status: 403 });
    }

    await connectDB();

    // Soft delete — keeps the style data but hides it from vendors
    const style = await AiStyle.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );
    if (!style) return NextResponse.json(apiError('Style not found'), { status: 404 });

    return NextResponse.json(apiSuccess({ style }, 'AI Style deactivated'));
  } catch (error: any) {
    return NextResponse.json(apiError('Delete failed: ' + error.message), { status: 500 });
  }
}
