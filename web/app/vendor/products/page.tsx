import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getVendorProducts } from '@/lib/products';
import VendorProductsClient from './VendorProductsClient';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Store from '@/models/Store';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic'; // Always fetch fresh data

async function getVendorFromCookies() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        await dbConnect();

        const user = await User.findById(decoded.userId).lean();
        if (!user || user.role !== 'vendor') return null;

        const store = await Store.findOne({ vendorId: decoded.userId }).lean();
        return { user, store };
    } catch {
        return null;
    }
}

export default async function VendorProductsPage() {
    const vendorData = await getVendorFromCookies();

    if (!vendorData) {
        redirect('/vendor/login');
    }

    const { store } = vendorData;

    if (!store) {
        redirect('/vendor/onboarding');
    }

    // Fetch vendor's products
    const { products, pagination } = await getVendorProducts(
        store._id.toString(),
        1,
        20
    );

    return (
        <VendorProductsClient
            initialProducts={products}
            initialPagination={{
                page: 1,
                total: pagination.total,
                hasMore: pagination.hasMore,
            }}
        />
    );
}
