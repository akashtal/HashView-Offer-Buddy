'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Store } from 'lucide-react';

export default function AuthTabs() {
    const pathname = usePathname();

    // Simplified vendor check
    const isVendor = pathname.startsWith('/vendor');

    // Determine if we are in a registration context
    const isRegisterPage = pathname.includes('register') || pathname.includes('signup');

    return (
        <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg flex shadow-inner">
                <Link
                    href={isRegisterPage ? '/signup' : '/signin'}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${!isVendor
                        ? 'bg-[#00A651] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                >
                    <User size={16} />
                    Buyer
                </Link>
                <Link
                    href={isRegisterPage ? '/vendor/register' : '/vendor/login'}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isVendor
                        ? 'bg-[#00A651] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                >
                    <Store size={16} />
                    Vendor
                </Link>
            </div>
        </div>
    );
}
