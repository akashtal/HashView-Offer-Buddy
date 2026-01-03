'use client';

import { useState } from 'react';
import { MapPin, ChevronDown, Loader2 } from 'lucide-react';
import { useLocation } from '@/lib/LocationContext';
import { INDIAN_CITIES } from '@/lib/location-utils';

export default function LocationSelector() {
    const { location, isLoading, requestLocation, setManualLocation } = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleDetectLocation = async () => {
        await requestLocation();
    };

    const handleCitySelect = (city: typeof INDIAN_CITIES[0]) => {
        setManualLocation({
            coordinates: city.coordinates,
            city: city.name,
            state: city.state,
            country: 'India'
        });
        setShowDropdown(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
                <MapPin size={18} className="text-[#2E3192]" />
                <span className="text-sm font-medium text-gray-700">
                    {location?.city || 'Select Location'}
                </span>
                <ChevronDown size={16} className="text-gray-500" />
            </button>

            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                        {/* Detect Location Button */}
                        <button
                            onClick={handleDetectLocation}
                            disabled={isLoading}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-200 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="text-[#2E3192] animate-spin" />
                            ) : (
                                <MapPin size={18} className="text-[#2E3192]" />
                            )}
                            <span className="text-sm font-medium text-[#2E3192]">
                                {isLoading ? 'Detecting...' : 'Detect My Location'}
                            </span>
                        </button>

                        {/* City List */}
                        <div className="py-2">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                Popular Cities
                            </div>
                            {INDIAN_CITIES.map((city) => (
                                <button
                                    key={city.name}
                                    onClick={() => handleCitySelect(city)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="text-sm font-medium text-gray-900 group-hover:text-[#2E3192]">
                                        {city.name}
                                    </div>
                                    <div className="text-xs text-gray-500">{city.state}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
