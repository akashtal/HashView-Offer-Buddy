'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

/**
 * Server Action for creating a product
 * React 19.2 feature: Direct server-side operations
 */
export async function createProductAction(formData: FormData) {
    try {
        await connectDB();

        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const price = JSON.parse(formData.get('price') as string);
        const category = formData.get('category') as string;
        const vendor = formData.get('vendor') as string;
        const images = JSON.parse(formData.get('images') as string);
        const location = JSON.parse(formData.get('location') as string);

        const product = await Product.create({
            title,
            description,
            price,
            category,
            vendor,
            images,
            location,
            isActive: true,
        });

        revalidatePath('/admin/products');
        revalidatePath('/api/products');
        revalidatePath('/products');

        return { success: true, product: JSON.parse(JSON.stringify(product)) };
    } catch (error: any) {
        console.error('Create product error:', error);
        throw new Error(error.message || 'Failed to create product');
    }
}

/**
 * Server Action for updating a product
 */
export async function updateProductAction(id: string, formData: FormData) {
    try {
        await connectDB();

        const updates: any = {};

        if (formData.get('title')) updates.title = formData.get('title');
        if (formData.get('description')) updates.description = formData.get('description');
        if (formData.get('price')) updates.price = JSON.parse(formData.get('price') as string);
        if (formData.get('category')) updates.category = formData.get('category');
        if (formData.get('images')) updates.images = JSON.parse(formData.get('images') as string);
        if (formData.get('location')) updates.location = JSON.parse(formData.get('location') as string);

        const product = await Product.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!product) {
            throw new Error('Product not found');
        }

        revalidatePath('/admin/products');
        revalidatePath('/api/products');
        revalidatePath(`/products/${id}`);

        return { success: true, product: JSON.parse(JSON.stringify(product)) };
    } catch (error: any) {
        console.error('Update product error:', error);
        throw new Error(error.message || 'Failed to update product');
    }
}

/**
 * Server Action for deleting a product
 */
export async function deleteProductAction(id: string) {
    try {
        await connectDB();

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            throw new Error('Product not found');
        }

        revalidatePath('/admin/products');
        revalidatePath('/api/products');
        revalidatePath('/products');

        return { success: true };
    } catch (error: any) {
        console.error('Delete product error:', error);
        throw new Error(error.message || 'Failed to delete product');
    }
}

/**
 * Server Action for toggling product active status
 */
export async function toggleProductStatusAction(id: string) {
    try {
        await connectDB();

        const product = await Product.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        product.isActive = !product.isActive;
        await product.save();

        revalidatePath('/admin/products');
        revalidatePath('/products');

        return { success: true, isActive: product.isActive };
    } catch (error: any) {
        console.error('Toggle product status error:', error);
        throw new Error(error.message || 'Failed to toggle product status');
    }
}
