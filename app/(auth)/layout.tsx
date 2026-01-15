import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center flex flex-col items-center gap-1">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                            <span className="text-[#FDB913]">Offer</span>Buddy
                            <span className="text-xs font-normal ml-1 bg-gray-100 px-2 py-0.5 rounded text-gray-500">Clone</span>
                        </h1>
                    </Link>
                    <h2 className="text-sm text-gray-600 font-medium tracking-wide uppercase">
                        Your B2B Marketplace for Industrial Goods
                    </h2>
                </div>
                {children}
            </div>
        </div>
    );
}
