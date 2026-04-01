'use client';

import { useState, useEffect } from 'react';
import { FiMapPin, FiX } from 'react-icons/fi';
import Button from './Button';

interface LocationPermissionBannerProps {
    onAllow: () => void;
    onDeny: () => void;
}

export default function LocationPermissionBanner({
    onAllow,
    onDeny,
}: LocationPermissionBannerProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const permission = localStorage.getItem('locationPermission');
        if (!permission) {
            setIsVisible(true);
        }
    }, []);

    const handleAllow = () => {
        onAllow();
        setIsVisible(false);
    };

    const handleDeny = () => {
        localStorage.setItem('locationPermission', 'denied');
        onDeny();
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiMapPin className="text-primary text-xl" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">
                            Enable Location Services
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Allow us to show you nearby shops and deals. We&apos;ll show the closest
                            vendors first to help you save time.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={handleAllow}
                                className="flex-1"
                            >
                                Allow
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleDeny}
                                className="flex-1"
                            >
                                Not Now
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={handleDeny}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <FiX />
                    </button>
                </div>
            </div>
        </div>
    );
}
