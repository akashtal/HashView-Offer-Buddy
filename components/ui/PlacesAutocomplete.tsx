'use client';

import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface PlacePrediction {
    description: string;
    place_id: string;
}

interface PlacesAutocompleteProps {
    searchQuery: string;
    onPlaceSelect: (placeId: string, description: string) => void;
}

export default function PlacesAutocomplete({ searchQuery, onPlaceSelect }: PlacesAutocompleteProps) {
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.length < 3) {
            setPredictions([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                console.log('🔍 Searching Google Places for:', searchQuery);
                const response = await fetch(
                    `/api/google/places/autocomplete?input=${encodeURIComponent(searchQuery)}`
                );
                const data = await response.json();

                if (data.predictions) {
                    console.log('✅ Found', data.predictions.length, 'suggestions');
                    setPredictions(data.predictions);
                } else {
                    setPredictions([]);
                }
            } catch (error) {
                console.error('❌ Places search error:', error);
                setPredictions([]);
            } finally {
                setIsLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    if (searchQuery.length < 3) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="px-4 py-3 flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Searching...
            </div>
        );
    }

    if (predictions.length === 0 && searchQuery.length >= 3) {
        return (
            <div className="px-4 py-3 text-gray-500 text-sm">
                No locations found
            </div>
        );
    }

    return (
        <>
            {predictions.map((prediction) => (
                <button
                    key={prediction.place_id}
                    onClick={() => onPlaceSelect(prediction.place_id, prediction.description)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {prediction.description}
                        </p>
                    </div>
                </button>
            ))}
        </>
    );
}
