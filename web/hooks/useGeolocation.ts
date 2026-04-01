'use client';

import { useState, useEffect } from 'react';

interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    isLoading: boolean;
    error: string | null;
    permissionStatus: 'granted' | 'denied' | 'prompt' | null;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        isLoading: false,
        error: null,
        permissionStatus: null,
    });

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('userLocation');
        if (stored) {
            try {
                const { latitude, longitude, timestamp } = JSON.parse(stored);
                // Use stored location if less than 24 hours old
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    setState(prev => ({ ...prev, latitude, longitude }));
                }
            } catch (e) {
                console.error('Failed to parse stored location');
            }
        }
    }, []);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setState(prev => ({
                ...prev,
                error: 'Geolocation is not supported by your browser',
            }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setState({
                    latitude,
                    longitude,
                    isLoading: false,
                    error: null,
                    permissionStatus: 'granted',
                });

                // Store in localStorage
                localStorage.setItem(
                    'userLocation',
                    JSON.stringify({ latitude, longitude, timestamp: Date.now() })
                );
                localStorage.setItem('locationPermission', 'granted');
            },
            (error) => {
                let errorMessage = 'Failed to get location';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'Location permission denied';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = 'Location information unavailable';
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = 'Location request timed out';
                }

                setState({
                    latitude: null,
                    longitude: null,
                    isLoading: false,
                    error: errorMessage,
                    permissionStatus: error.code === error.PERMISSION_DENIED ? 'denied' : null,
                });
                localStorage.setItem('locationPermission', 'denied');
            }
        );
    };

    const clearLocation = () => {
        setState({
            latitude: null,
            longitude: null,
            isLoading: false,
            error: null,
            permissionStatus: null,
        });
        localStorage.removeItem('userLocation');
    };

    return {
        ...state,
        requestLocation,
        clearLocation,
        hasLocation: state.latitude !== null && state.longitude !== null,
    };
}
