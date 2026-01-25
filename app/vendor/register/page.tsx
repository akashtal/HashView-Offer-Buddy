'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Mail, Lock, Store, Loader2, ArrowRight, Phone, MapPin } from 'lucide-react';
import AuthTabs from '@/components/auth/AuthTabs';

export default function VendorRegisterPage() {
    const router = useRouter();
    const { registerVendor } = useAuthStore();
    const [formData, setFormData] = useState({
        shopName: '',
        email: '',
        password: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await registerVendor(formData);
            router.push('/vendor/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center flex flex-col items-center gap-1 mb-6">
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
                <p className="text-center text-sm text-gray-600 mb-4">
                    Already a vendor? <Link href="/vendor/login" className="font-medium text-[#00A651] hover:text-[#008f45]">Sign in to portal</Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <AuthTabs />
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 animate-fadeIn">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                                Business / Shop Name
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Store className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="shopName"
                                    name="shopName"
                                    type="text"
                                    required
                                    className="focus:ring-[#002B4E] focus:border-[#002B4E] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                    placeholder="My Awesome Store"
                                    value={formData.shopName}
                                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Business Email
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="focus:ring-[#002B4E] focus:border-[#002B4E] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                    placeholder="vendor@business.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Contact Phone
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    className="focus:ring-[#002B4E] focus:border-[#002B4E] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="focus:ring-[#002B4E] focus:border-[#002B4E] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#002B4E] hover:bg-[#001f3f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002B4E] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <>
                                        Register Business <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-xs text-center text-gray-500">
                            Looking for verified leads? Join India&apos;s fastest growing B2B network.
                        </p>
                        <div className="mt-3">
                            <span className="text-sm text-gray-600">Already registered? </span>
                            <Link href="/vendor/login" className="text-sm font-medium text-[#002B4E] hover:underline">
                                Vendor Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
