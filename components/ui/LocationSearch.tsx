'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, ChevronDown } from 'lucide-react';
import { INDIAN_CITIES } from '@/lib/location-utils';
import { useLocation } from '@/lib/LocationContext';

interface LocationSearchProps {
    onLocationSelect?: (location: { latitude: number; longitude: number; city: string }) => void;
    className?: string;
}

export default function LocationSearch({ onLocationSelect, className = '' }: LocationSearchProps) {
    const { location, setManualLocation, isLoading } = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter cities based on search query
    const filteredCities = searchQuery
        ? INDIAN_CITIES.filter(city =>
            city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            city.state.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : INDIAN_CITIES;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCitySelect = (city: typeof INDIAN_CITIES[0]) => {
        const locationData = {
            coordinates: city.coordinates,
            city: city.name,
            state: city.state,
            country: 'India'
        };

        setManualLocation(locationData);

        if (onLocationSelect) {
            onLocationSelect({
                latitude: city.coordinates.latitude,
                longitude: city.coordinates.longitude,
                city: city.name
            });
        }

        setShowDropdown(false);
        setSearchQuery('');
    };

    const handleUseMyLocation = async () => {
        console.log('🟢 LocationSearch: Use My Location button clicked!');
        setIsGettingLocation(true);
        try {
            if (!navigator.geolocation) {
                console.error('❌ Geolocation NOT supported by browser');
                alert('Geolocation is not supported by your browser');
                setIsGettingLocation(false);
                return;
            }

            console.log('✅ Geolocation is supported, requesting position...');

            // Mobile-optimized geolocation options
            const options = {
                enableHighAccuracy: false, // Start with low accuracy for faster response on mobile
                timeout: 30000, // 30 seconds - longer for mobile
                maximumAge: 300000 // 5 minutes - use cached location if available
            };

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    console.log('✅ SUCCESS! Got position:', position.coords);

                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    // Call reverse geocoding to get actual city name
                    console.log('🌍 Starting reverse geocoding...');
                    const { reverseGeocode } = await import('@/lib/location-utils');
                    const locationData = await reverseGeocode(coords);

                    console.log('✅ Calling setManualLocation with:', locationData);
                    setManualLocation(locationData);

                    if (onLocationSelect) {
                        onLocationSelect({
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            city: locationData.city || 'Current Location'
                        });
                    }

                    setShowDropdown(false);
                    setIsGettingLocation(false);
                },
                (error) => {
                    console.error('❌ GEOLOCATION ERROR:', error);
                    console.error('❌ Error code:', error.code);
                    console.error('❌ Error message:', error.message);

                    let errorMessage = '';
                    if (error.code === 1) {
                        errorMessage = '📍 Please turn on location permissions in your browser settings.';
                    } else if (error.code === 2) {
                        errorMessage = '📍 Turn on your device location (GPS) to continue.';
                    } else if (error.code === 3) {
                        errorMessage = '📍 Location request timed out. Please try again.';
                    } else {
                        errorMessage = '📍 Unable to get location. Please enable location services.';
                    }

                    alert(errorMessage);
                    setIsGettingLocation(false);
                },
                options
            );
        } catch (error) {
            console.error('❌ Unexpected error:', error);
            alert('An error occurred while getting your location.');
            setIsGettingLocation(false);
        }
    };


    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Location Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-300 hover:border-[#FDB913] hover:bg-gray-50 transition-all group"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-[#FDB913]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-500 font-medium">Detecting...</span>
                            <span className="text-sm font-bold text-gray-900">Finding location</span>
                        </div>
                    </>
                ) : (
                    <>
                        <MapPin size={18} className="text-gray-600 group-hover:text-[#FDB913] transition-colors" />
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-500 font-medium">Showing near</span>
                            <span className="text-sm font-bold text-gray-900 truncate max-w-[150px]">
                                {location?.city || 'Select Location'}
                            </span>
                        </div>
                    </>
                )}
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    {/* Use My Location Button */}
                    <button
                        onClick={handleUseMyLocation}
                        disabled={isGettingLocation}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="p-2 bg-[#FDB913] rounded-full">
                            <Navigation size={16} className="text-black" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-gray-900">
                                {isGettingLocation ? 'Getting location...' : 'Use My Location'}
                            </p>
                            <p className="text-xs text-gray-500">Enable GPS for accurate results</p>
                        </div>
                    </button>

                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search city..."
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-transparent"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Cities List */}
                    <div className="overflow-y-auto flex-1">
                        {filteredCities.length > 0 ? (
                            filteredCities.map((city) => (
                                <button
                                    key={`${city.name}-${city.state}`}
                                    onClick={() => handleCitySelect(city)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{city.name}</p>
                                        <p className="text-xs text-gray-500">{city.state}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                No cities found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
