'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Mail, Lock, User, Loader2, ArrowRight, Store } from 'lucide-react';

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user', // default role
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await axios.post('/api/auth/register', formData);
            router.push('/signin?registered=true');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Already have an account? <Link href="/signin" className="font-medium text-[#00A651] hover:text-[#008f45]">Sign in</Link>
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 animate-fadeIn">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            className="focus:ring-[#FDB913] focus:border-[#FDB913] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
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
                            className="focus:ring-[#FDB913] focus:border-[#FDB913] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                            className="focus:ring-[#FDB913] focus:border-[#FDB913] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="role"
                                value="user"
                                checked={formData.role === 'user'}
                                onChange={() => setFormData({ ...formData, role: 'user' })}
                                className="text-[#FDB913] focus:ring-[#FDB913]"
                            />
                            <span className="text-sm">Buyer</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="role"
                                value="vendor"
                                checked={formData.role === 'vendor'}
                                onChange={() => setFormData({ ...formData, role: 'vendor' })}
                                className="text-[#FDB913] focus:ring-[#FDB913]"
                            />
                            <span className="text-sm flex items-center gap-1"><Store size={14} /> Seller / Vendor</span>
                        </label>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00A651] hover:bg-[#008f45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A651] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            <>
                                Create Account <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                    By creating an account, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
}
