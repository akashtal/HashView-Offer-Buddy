'use client';

import { FiSearch, FiEye, FiNavigation } from 'react-icons/fi';

export default function AboutPage() {
    return (
        <div className="container-custom py-16">
            {/* Mission Section */}
            <div className="max-w-3xl mx-auto text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-6">
                    Putting Savings Back in Your Pocket
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Offer Buddy was created out of a simple frustration: it&apos;s too hard to find genuinely good deals nearby. We realized that local businesses have great offers, but shoppers waste time and fuel hunting for them.
                </p>
            </div>

            {/* Our Promise */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiEye className="text-2xl text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-3">Transparency</h3>
                    <p className="text-gray-600">
                        We provide direct links and clear photos. No bait-and-switch. You see exactly what&apos;s on offer.
                    </p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiSearch className="text-2xl text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-3">Focus</h3>
                    <p className="text-gray-600">
                        We only show you deals relevant to your area, making every search efficient and meaningful.
                    </p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiNavigation className="text-2xl text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-3">Community</h3>
                    <p className="text-gray-600">
                        By connecting shoppers to local stores, we help both the consumer save money and the business gain new customers.
                    </p>
                </div>
            </div>

            {/* Closing */}
            <div className="text-center bg-accent-light p-12 rounded-2xl">
                <h2 className="text-2xl font-bold text-secondary mb-4">
                    We are Offer Buddy
                </h2>
                <p className="text-lg text-gray-600">
                    And we&apos;re dedicated to helping you shop smarter, not harder.
                </p>
            </div>
        </div>
    );
}
