'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PlacesAutocomplete from './PlacesAutocomplete';

interface AddressAutocompleteProps {
    label?: string;
    error?: string;
    value: string;
    onChange: (value: string) => void;
    onSelect: (details: any) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
    name?: string;
}

export default function AddressAutocomplete({
    label,
    error,
    value,
    onChange,
    onSelect,
    className,
    placeholder,
    required,
    name
}: AddressAutocompleteProps) {
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePlaceSelect = async (placeId: string, description: string) => {
        // Update input immediately
        onChange(description);
        setIsFocused(false);

        try {
            // Fetch place details
            const response = await fetch(`/api/google/places/details?placeId=${placeId}`);
            const data = await response.json();

            if (data.coordinates) {
                const [lng, lat] = data.coordinates;
                const details = {
                    coordinates: { latitude: lat, longitude: lng },
                    city: data.city,
                    state: data.state,
                    country: data.country || 'India',
                    pincode: data.pincode,
                    address: data.formattedAddress
                };
                onSelect(details);
            }
        } catch (error) {
            console.error('Failed to fetch place details:', error);
        }
    };

    return (
        <div className="w-full" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin size={18} />
                </div>
                <input
                    type="text"
                    name={name}
                    className={cn(
                        'input-field pl-10',
                        error && 'border-red-500 focus:ring-red-500',
                        className
                    )}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    required={required}
                    autoComplete="off"
                />

                {/* Dropdown Results */}
                {isFocused && value.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
                        <PlacesAutocomplete
                            searchQuery={value}
                            onPlaceSelect={handlePlaceSelect}
                        />
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
