'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { FiUsers, FiShoppingBag, FiPackage, FiGrid, FiBarChart2, FiLogOut } from 'react-icons/fi';
import { useEffect } from 'react';
import Loading from '@/components/ui/Loading';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout, isLoading: authLoading } = useAuthStore();

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
            router.push('/login');
        }
    }, [isAuthenticated, user, authLoading, router]);

    if (authLoading) return <Loading fullScreen />;

    if (!user || user.role !== 'admin') return null;

    const navItems = [
        { name: 'Overview', href: '/admin/dashboard', icon: FiBarChart2 },
        { name: 'Vendors', href: '/admin/vendors', icon: FiShoppingBag },
        { name: 'Products', href: '/admin/products', icon: FiPackage },
        { name: 'Categories', href: '/admin/categories', icon: FiGrid },
        { name: 'Users', href: '/admin/users', icon: FiUsers },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-secondary text-white hidden md:flex flex-col fixed h-full">
                <div className="h-16 flex items-center px-6 border-b border-gray-700">
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive(item.href)
                                    ? 'bg-primary text-white'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
                            {user.name?.[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => logout().then(() => router.push('/login'))}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-white/10 transition-colors"
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
