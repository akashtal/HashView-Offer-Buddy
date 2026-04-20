'use client';

import { MapPin, ChevronDown, Search, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocation } from '@/lib/LocationContext';
import { INDIAN_CITIES } from '@/lib/location-utils';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

export default function SwiggyHeader() {
    const { location, setManualLocation } = useLocation();
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const { unreadCount, fetchUnreadCount } = useChatStore();
    const { isAuthenticated } = useAuthStore();

    // Fetch unread count on mount and periodically
    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000); // refresh every 30s
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchUnreadCount]);

    return (
        <header className="bg-white border-b border-[#E9E9EB] sticky top-0 z-40">
            <div className="container-custom">
                <div className="flex items-center gap-4 py-4">
                    {/* Location Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                            className="flex items-center gap-2 hover:text-[#FD9139] transition-colors"
                        >
                            <MapPin size={20} className="text-[#FD9139]" />
                            <div className="hidden md:block text-left">
                                <div className="text-xs text-[#686B78]">Deliver to</div>
                                <div className="font-semibold text-[#282C3F] flex items-center gap-1">
                                    {location?.city || 'Select Location'}
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                            <div className="md:hidden font-semibold text-[#282C3F]">
                                {location?.city || 'Location'}
                            </div>
                        </button>

                        {/* Location Dropdown */}
                        {showLocationDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowLocationDropdown(false)}
                                />
                                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-[#E9E9EB] z-50 max-h-96 overflow-y-auto">
                                    <div className="p-4">
                                        <div className="text-sm font-semibold text-[#282C3F] mb-3">
                                            Popular Cities
                                        </div>
                                        {INDIAN_CITIES.map((city) => (
                                            <button
                                                key={city.name}
                                                onClick={() => {
                                                    setManualLocation({
                                                        coordinates: city.coordinates,
                                                        city: city.name,
                                                        state: city.state,
                                                        country: 'India'
                                                    });
                                                    setShowLocationDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-2 hover:bg-[#F5F5F5] rounded transition-colors"
                                            >
                                                <div className="text-sm font-medium text-[#282C3F]">
                                                    {city.name}
                                                </div>
                                                <div className="text-xs text-[#686B78]">{city.state}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#686B78]" size={18} />
                        <input
                            type="text"
                            placeholder="Search for products, suppliers and categories"
                            className="w-full pl-12 pr-4 py-3 border border-[#E9E9EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FD9139] focus:border-transparent text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    window.location.href = `/products?search=${(e.target as HTMLInputElement).value}`;
                                }
                            }}
                        />
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/offers" className="text-sm font-medium text-[#282C3F] hover:text-[#FD9139] transition-colors">
                            Offers
                        </Link>
                        <Link href="/help" className="text-sm font-medium text-[#282C3F] hover:text-[#FD9139] transition-colors">
                            Help
                        </Link>
                        <Link href="/signin" className="text-sm font-medium text-[#282C3F] hover:text-[#FD9139] transition-colors">
                            Sign In
                        </Link>
                        {/* Chat Button with Unread Badge */}
                        <Link
                            href="/chat"
                            className="relative text-sm font-medium text-[#282C3F] hover:text-[#FD9139] transition-colors flex items-center gap-1"
                        >
                            <span className="relative">
                                <MessageCircle size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </span>
                            Messages
                        </Link>
                        <Link href="/cart" className="text-sm font-medium text-[#282C3F] hover:text-[#FD9139] transition-colors flex items-center gap-1">
                            Cart
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
