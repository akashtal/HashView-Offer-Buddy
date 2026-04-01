'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

/**
 * Server Action for creating a category
 * React 19.2 feature: Server Actions for secure backend operations
 */
export async function createCategoryAction(formData: FormData) {
    try {
        await connectDB();

        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;
        const image = formData.get('image') as string;

        if (!name || !slug) {
            throw new Error('Name and slug are required');
        }

        const category = await Category.create({
            name,
            slug,
            image,
            isActive: true,
        });

        revalidatePath('/admin/categories');
        revalidatePath('/api/categories');

        return { success: true, category: JSON.parse(JSON.stringify(category)) };
    } catch (error: any) {
        console.error('Create category error:', error);
        throw new Error(error.message || 'Failed to create category');
    }
}

/**
 * Server Action for updating a category
 */
export async function updateCategoryAction(id: string, formData: FormData) {
    try {
        await connectDB();

        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;
        const image = formData.get('image') as string;

        const category = await Category.findByIdAndUpdate(
            id,
            { name, slug, image },
            { new: true, runValidators: true }
        );

        if (!category) {
            throw new Error('Category not found');
        }

        revalidatePath('/admin/categories');
        revalidatePath('/api/categories');

        return { success: true, category: JSON.parse(JSON.stringify(category)) };
    } catch (error: any) {
        console.error('Update category error:', error);
        throw new Error(error.message || 'Failed to update category');
    }
}

/**
 * Server Action for deleting a category
 */
export async function deleteCategoryAction(id: string) {
    try {
        await connectDB();

        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            throw new Error('Category not found');
        }

        revalidatePath('/admin/categories');
        revalidatePath('/api/categories');

        return { success: true };
    } catch (error: any) {
        console.error('Delete category error:', error);
        throw new Error(error.message || 'Failed to delete category');
    }
}
