import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import SafeStorage from '@/utils/safe-storage';
import * as ExpoLocation from 'expo-location';
import {
    Coordinates,
    LocationData,
    reverseGeocode,
    INDIAN_CITIES
} from '@/utils/location-utils';

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
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('📍 Please grant location permission to find nearby products.');
                setIsLoading(false);
                return;
            }

            const pos = await ExpoLocation.getCurrentPositionAsync({
                accuracy: ExpoLocation.Accuracy.Balanced,
            });

            const coords: Coordinates = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            };

            await SafeStorage.setItem('lastLocationRequest', Date.now().toString());

            const locationData = await reverseGeocode(coords);
            setLocation(locationData);
        } catch (err: any) {
            console.error('Location error:', err);
            if (err?.code === 'E_LOCATION_SERVICES_DISABLED') {
                setError('📍 Turn on your device location to find nearby products.');
            } else {
                setError('📍 Unable to get your location. Please select a city manually.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load location from AsyncStorage on mount, or auto-detect
    useEffect(() => {
        if (hasAttemptedAutoDetect.current) return;
        hasAttemptedAutoDetect.current = true;

        (async () => {
            try {
                const savedLocation = await SafeStorage.getItem('userLocation');
                const lastLocationRequest = await SafeStorage.getItem('lastLocationRequest');
                const now = Date.now();
                const ONE_DAY = 24 * 60 * 60 * 1000;

                if (savedLocation) {
                    setLocation(JSON.parse(savedLocation));

                    if (lastLocationRequest) {
                        const lastRequest = parseInt(lastLocationRequest, 10);
                        if (now - lastRequest > ONE_DAY) {
                            requestLocation().catch(() => {});
                        }
                    }
                } else {
                    requestLocation().catch(() => {});
                }
            } catch (e) {
                console.error('Failed to load saved location:', e);
                requestLocation().catch(() => {});
            }
        })();
    }, [requestLocation]);

    // Save location to AsyncStorage whenever it changes
    useEffect(() => {
        if (location) {
            SafeStorage.setItem('userLocation', JSON.stringify(location));
        } else {
            SafeStorage.removeItem('userLocation');
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
