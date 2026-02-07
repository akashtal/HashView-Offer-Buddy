'use server';

import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Store from '@/models/Store';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

const createProductSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    categoryId: z.string(),
    price: z.number().min(0),
    salePrice: z.number().optional(),
    stock: z.number().min(0),
});

/**
 * Upload image and return URL
 */
async function uploadImage(file: File): Promise<string> {
    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const ext = file.name.split('.').pop();
        const filename = `${randomBytes(16).toString('hex')}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        // Write file
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        return `/uploads/products/${filename}`;
    } catch (error) {
        console.error('Image upload error:', error);
        throw new Error('Failed to upload image');
    }
}

export async function createProductAction(formData: FormData) {
    try {
        await dbConnect();

        // Extract and process images
        const images: string[] = [];
        const imageFiles = formData.getAll('images') as File[];

        for (const file of imageFiles) {
            if (file && file.size > 0) {
                const url = await uploadImage(file);
                images.push(url);
            }
        }

        const rawData = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            categoryId: formData.get('categoryId') as string,
            price: Number(formData.get('price')),
            salePrice: formData.get('salePrice') ? Number(formData.get('salePrice')) : undefined,
            stock: Number(formData.get('stock')),
        };

        const validated = createProductSchema.parse(rawData);

        // Get vendor/store ID from form or auth context
        const vendorId = formData.get('vendorId') as string;

        const product = await Product.create({
            ...validated,
            category: validated.categoryId,
            vendorId,
            images,
            isActive: true,
        });

        revalidatePath('/vendor/products');
        revalidatePath('/products');

        return {
            success: true,
            data: { product: JSON.parse(JSON.stringify(product)) },
            message: 'Product created successfully',
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error('Create product error:', error);
        return { success: false, error: 'Failed to create product' };
    }
}

export async function updateProductAction(productId: string, formData: FormData) {
    try {
        await dbConnect();

        // Extract and process images if any new ones provided
        const images: string[] = [];
        const imageFiles = formData.getAll('images') as File[];
        const existingImages = formData.get('existingImages') as string;

        // Add existing images
        if (existingImages) {
            images.push(...JSON.parse(existingImages));
        }

        // Add new images
        for (const file of imageFiles) {
            if (file && file.size > 0) {
                const url = await uploadImage(file);
                images.push(url);
            }
        }

        const updates: any = {};

        if (formData.get('title')) updates.title = formData.get('title');
        if (formData.get('description')) updates.description = formData.get('description');
        if (formData.get('categoryId')) updates.category = formData.get('categoryId');
        if (formData.get('price')) updates.price = Number(formData.get('price'));
        if (formData.get('salePrice')) updates.salePrice = Number(formData.get('salePrice'));
        if (formData.get('stock')) updates.stock = Number(formData.get('stock'));
        if (images.length > 0) updates.images = images;

        const product = await Product.findByIdAndUpdate(
            productId,
            updates,
            { new: true, runValidators: true }
        );

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        revalidatePath('/vendor/products');
        revalidatePath(`/products/${productId}`);

        return {
            success: true,
            data: { product: JSON.parse(JSON.stringify(product)) },
            message: 'Product updated successfully',
        };
    } catch (error: any) {
        console.error('Update product error:', error);
        return { success: false, error: 'Failed to update product' };
    }
}

export async function onboardVendorAction(formData: FormData) {
    try {
        await dbConnect();

        // Handle shop logo upload
        let shopLogo = '';
        const logoFile = formData.get('shopLogo') as File;
        if (logoFile && logoFile.size > 0) {
            shopLogo = await uploadImage(logoFile);
        }

        const vendorId = formData.get('vendorId') as string;

        const storeData = {
            vendorId,
            shopName: formData.get('shopName') as string,
            shopDescription: formData.get('shopDescription') as string,
            category: formData.get('categoryId') as string,
            shopLogo,
            contactInfo: {
                phone: formData.get('phone') as string,
                email: formData.get('email') as string,
                whatsapp: formData.get('whatsapp') as string,
            },
            location: {
                address: formData.get('address') as string,
                city: formData.get('city') as string,
                state: formData.get('state') as string,
                pincode: formData.get('pincode') as string,
                coordinates: {
                    type: 'Point',
                    coordinates: [
                        Number(formData.get('longitude')),
                        Number(formData.get('latitude')),
                    ],
                },
            },
            isApproved: false,
            isActive: true,
        };

        const store = await Store.create(storeData);

        revalidatePath('/vendor/dashboard');

        return {
            success: true,
            data: { store: JSON.parse(JSON.stringify(store)) },
            message: 'Store created successfully. Awaiting admin approval.',
        };
    } catch (error: any) {
        console.error('Onboard vendor error:', error);
        return { success: false, error: 'Failed to create store' };
    }
}
