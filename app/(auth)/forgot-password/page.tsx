'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPasswordAction, resetPasswordAction } from '../actions';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData(e.currentTarget);

        try {
            const result = await forgotPasswordAction(formData);
            if (result.success) {
                // Type narrowing: TypeScript knows result has 'message' property here
                setSuccess('message' in result ? result.message : 'OTP sent successfully to your email.');
                setStep('reset');
                setEmail(formData.get('email') as string);
            } else {
                setError(result.error || 'Something went wrong. Please try again.');
            }
        } catch (err: any) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');

        // Add email to formData
        formData.append('email', email);

        try {
            const result = await resetPasswordAction(formData);
            if (result.success) {
                setSuccess('Password reset successfully! Redirecting to sign in...');
                setTimeout(() => {
                    router.push('/signin');
                }, 3000);
            } else {
                setError(result.error || 'Invalid OTP or expired. Please try again.');
            }
        } catch (err: any) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-4">
            <div className="mx-auto w-full max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {step === 'email' ? 'Forgot password?' : 'Reset your password'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {step === 'email'
                                ? "No worries, we'll send you an OTP to your email."
                                : "Enter the 6-digit OTP sent to your email and your new password."}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 animate-fadeIn">
                                {error}
                            </div>
                        )}
                        {success && !error && (
                            <div className="p-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-700 animate-fadeIn">
                                {success}
                            </div>
                        )}

                        {step === 'email' ? (
                            <form className="space-y-6" onSubmit={handleSendOTP}>
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
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-70 transition-colors"
                                >
                                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Send OTP <Send className="ml-2 h-4 w-4" /></>}
                                </button>
                            </form>
                        ) : (
                            <form className="space-y-6" onSubmit={handleResetPassword}>
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                        6-Digit OTP
                                    </label>
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="mt-1 focus:ring-[#FDB913] focus:border-[#FDB913] block w-full text-center text-2xl tracking-[1em] border-gray-300 rounded-md py-2"
                                        onChange={(e) => e.target.value = e.target.value.replace(/\D/g, '')}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        New Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        minLength={6}
                                        className="mt-1 focus:ring-[#FDB913] focus:border-[#FDB913] block w-full sm:text-sm border-gray-300 rounded-md py-2"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                        Confirm New Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        minLength={6}
                                        className="mt-1 focus:ring-[#FDB913] focus:border-[#FDB913] block w-full sm:text-sm border-gray-300 rounded-md py-2"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00A651] hover:bg-[#008f45] disabled:opacity-70 transition-colors"
                                >
                                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Resend OTP
                                </button>
                            </form>
                        )}

                        <div className="text-center">
                            <Link href="/signin" className="inline-flex items-center text-sm font-medium text-[#00A651] hover:text-[#008f45]">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
