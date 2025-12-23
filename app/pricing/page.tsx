'use client';

import { FiCheck } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function PricingPage() {
    return (
        <div className="container-custom py-16">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold text-secondary mb-4">
                    Simple, Transparent Pricing for Vendors
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Start for free, upgrade as you grow. No hidden fees.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Free Tier */}
                <div className="bg-white rounded-2xl shadow-sm border p-8 hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-bold text-secondary mb-2">Starter</h3>
                    <div className="text-4xl font-bold text-primary mb-6">Free</div>
                    <p className="text-gray-600 mb-8">
                        Perfect for small local shops just getting started.
                    </p>
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-green-500" />
                            <span>List up to 5 products</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-green-500" />
                            <span>Basic analytics</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-green-500" />
                            <span>Standard support</span>
                        </li>
                    </ul>
                    <Link href="/vendor/register">
                        <Button variant="outline" fullWidth>Get Started</Button>
                    </Link>
                </div>

                {/* Pro Tier */}
                <div className="bg-secondary text-white rounded-2xl shadow-xl p-8 transform scale-105 relative">
                    <div className="absolute top-0 right-0 bg-primary text-secondary text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                        POPULAR
                    </div>
                    <h3 className="text-xl font-bold mb-2">Growth</h3>
                    <div className="text-4xl font-bold text-primary mb-6">₹499<span className="text-sm text-gray-400 font-normal">/mo</span></div>
                    <p className="text-gray-300 mb-8">
                        For growing businesses who need more visibility.
                    </p>
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-primary" />
                            <span>List up to 50 products</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-primary" />
                            <span>Advanced analytics</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-primary" />
                            <span>Featured placement</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-primary" />
                            <span>Priority support</span>
                        </li>
                    </ul>
                    <Link href="/vendor/register">
                        <Button variant="primary" fullWidth>Start Free Trial</Button>
                    </Link>
                </div>

                {/* Enterprise Tier */}
                <div className="bg-white rounded-2xl shadow-sm border p-8 hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-bold text-secondary mb-2">Business</h3>
                    <div className="text-4xl font-bold text-primary mb-6">₹999<span className="text-sm text-gray-400 font-normal">/mo</span></div>
                    <p className="text-gray-600 mb-8">
                        Maximum exposure for established brands.
                    </p>
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-green-500" />
                            <span>Unlimited products</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-green-500" />
                            <span>Premium analytics</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-green-500" />
                            <span>Top search ranking</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiCheck className="text-green-500" />
                            <span>Dedicated manager</span>
                        </li>
                    </ul>
                    <Link href="/vendor/register">
                        <Button variant="outline" fullWidth>Contact Sales</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
