import { getAdminProducts } from '@/lib/products';
import AdminProductsClient from './AdminProductsClient';

export const dynamic = 'force-dynamic'; // Always fetch fresh data for admin

export default async function AdminProductsPage() {
    const { products, pagination } = await getAdminProducts(1, 20);

    return (
        <AdminProductsClient
            initialProducts={products}
            initialPagination={{
                page: 1,
                total: pagination.total,
                hasMore: pagination.hasMore,
            }}
        />
    );
}
