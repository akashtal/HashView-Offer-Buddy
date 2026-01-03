'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import {
    Coordinates,
    LocationData,
    getCurrentLocation,
    INDIAN_CITIES
} from '@/lib/location-utils';

interface LocationContextType {
    location: LocationData | null;
    isLoading: boolean;
    error: string | null;
    requestLocation: () => Promise<void>;
    setManualLocation: (location: LocationData) => void;
    clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasAttemptedAutoDetect = useRef(false);

    const requestLocation = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const coords = await getCurrentLocation();

            if (!coords) {
                setError('Unable to get your location. Please select a city manually.');
                setIsLoading(false);
                return;
            }

            // Store the timestamp of this location request
            localStorage.setItem('lastLocationRequest', Date.now().toString());

            // For now, just store coordinates
            // In future, can use Google Geocoding API for reverse geocoding
            setLocation({
                coordinates: coords,
                city: 'Detected Location',
            });
        } catch (err) {
            setError('Location access denied. Please select a city manually.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Try to load location from localStorage on mount, or auto-detect if not available
    useEffect(() => {
        // Prevent double execution in development strict mode
        if (hasAttemptedAutoDetect.current) return;
        hasAttemptedAutoDetect.current = true;

        const savedLocation = localStorage.getItem('userLocation');
        const lastLocationRequest = localStorage.getItem('lastLocationRequest');
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (savedLocation) {
            try {
                setLocation(JSON.parse(savedLocation));

                // Auto-refresh location if it's been more than 24 hours
                if (lastLocationRequest) {
                    const lastRequest = parseInt(lastLocationRequest, 10);
                    if (now - lastRequest > ONE_DAY) {
                        // Silently request location update in background
                        requestLocation().catch(() => {
                            // Silently fail - keep existing location
                            console.log('Background location refresh failed, keeping existing location');
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to parse saved location:', e);
                // If parsing fails, request new location
                requestLocation().catch(() => {
                    // Silently fail - user can manually select location
                });
            }
        } else {
            // No saved location - automatically request location
            requestLocation().catch(() => {
                // Silently fail - show location selector without location
                console.log('Auto location detection failed - user can manually select');
            });
        }
    }, [requestLocation]);

    // Save location to localStorage whenever it changes
    useEffect(() => {
        if (location) {
            localStorage.setItem('userLocation', JSON.stringify(location));
        } else {
            localStorage.removeItem('userLocation');
        }
    }, [location]);

    const setManualLocation = (locationData: LocationData) => {
        setLocation(locationData);
        setError(null);
    };

    const clearLocation = () => {
        setLocation(null);
        setError(null);
    };

    return (
        <LocationContext.Provider
            value={{
                location,
                isLoading,
                error,
                requestLocation,
                setManualLocation,
                clearLocation,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);

    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }

    return context;
}
