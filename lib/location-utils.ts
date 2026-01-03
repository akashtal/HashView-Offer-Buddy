// Utility functions for location-based features

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface LocationData {
    coordinates: Coordinates;
    city?: string;
    state?: string;
    country?: string;
    address?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(
    coord1: Coordinates,
    coord2: Coordinates
): number {
    const R = 6371; // Earth's radius in kilometers

    const lat1Rad = (coord1.latitude * Math.PI) / 180;
    const lat2Rad = (coord2.latitude * Math.PI) / 180;
    const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m away`;
    } else if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)}km away`;
    } else {
        return `${Math.round(distanceKm)}km away`;
    }
}

/**
 * Check if browser supports geolocation
 */
export function isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
}

/**
 * Get user's current location
 * @returns Promise with coordinates or null if unavailable/denied
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
    if (!isGeolocationSupported()) {
        return null;
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.error('Error getting location:', error);
                resolve(null);
            },
            {
                enableHighAccuracy: false, // Start with low accuracy for faster response on mobile
                timeout: 30000, // 30 seconds - longer for mobile devices
                maximumAge: 300000, // 5 minutes - use cached location
            }
        );
    });
}

/**
 * Sort items by distance from a given coordinate
 * @param items Array of items with coordinates
 * @param userCoordinates User's current coordinates
 * @returns Sorted array with distance added
 */
export function sortByDistance<T extends { coordinates?: Coordinates }>(
    items: T[],
    userCoordinates: Coordinates
): (T & { distance?: number })[] {
    return items
        .map((item) => {
            if (!item.coordinates) {
                return { ...item, distance: undefined };
            }

            const distance = calculateDistance(userCoordinates, item.coordinates);
            return { ...item, distance };
        })
        .sort((a, b) => {
            if (a.distance === undefined) return 1;
            if (b.distance === undefined) return -1;
            return a.distance - b.distance;
        });
}

/**
 * Filter items within a certain radius
 * @param items Array of items with coordinates
 * @param userCoordinates User's current coordinates
 * @param radiusKm Radius in kilometers
 * @returns Filtered array
 */
export function filterByRadius<T extends { coordinates?: Coordinates }>(
    items: T[],
    userCoordinates: Coordinates,
    radiusKm: number
): T[] {
    return items.filter((item) => {
        if (!item.coordinates) return false;
        const distance = calculateDistance(userCoordinates, item.coordinates);
        return distance <= radiusKm;
    });
}

/**
 * Major Indian cities with their coordinates for fallback selection
 */
export const INDIAN_CITIES = [
    { name: 'Mumbai', state: 'Maharashtra', coordinates: { latitude: 19.076, longitude: 72.8777 } },
    { name: 'Delhi', state: 'Delhi', coordinates: { latitude: 28.7041, longitude: 77.1025 } },
    { name: 'Bangalore', state: 'Karnataka', coordinates: { latitude: 12.9716, longitude: 77.5946 } },
    { name: 'Hyderabad', state: 'Telangana', coordinates: { latitude: 17.385, longitude: 78.4867 } },
    { name: 'Ahmedabad', state: 'Gujarat', coordinates: { latitude: 23.0225, longitude: 72.5714 } },
    { name: 'Chennai', state: 'Tamil Nadu', coordinates: { latitude: 13.0827, longitude: 80.2707 } },
    { name: 'Kolkata', state: 'West Bengal', coordinates: { latitude: 22.5726, longitude: 88.3639 } },
    { name: 'Pune', state: 'Maharashtra', coordinates: { latitude: 18.5204, longitude: 73.8567 } },
    { name: 'Jaipur', state: 'Rajasthan', coordinates: { latitude: 26.9124, longitude: 75.7873 } },
    { name: 'Surat', state: 'Gujarat', coordinates: { latitude: 21.1702, longitude: 72.8311 } },
    { name: 'Lucknow', state: 'Uttar Pradesh', coordinates: { latitude: 26.8467, longitude: 80.9462 } },
    { name: 'Kanpur', state: 'Uttar Pradesh', coordinates: { latitude: 26.4499, longitude: 80.3319 } },
    { name: 'Nagpur', state: 'Maharashtra', coordinates: { latitude: 21.1458, longitude: 79.0882 } },
    { name: 'Indore', state: 'Madhya Pradesh', coordinates: { latitude: 22.7196, longitude: 75.8577 } },
    { name: 'Thane', state: 'Maharashtra', coordinates: { latitude: 19.2183, longitude: 72.9781 } },
    { name: 'Bhopal', state: 'Madhya Pradesh', coordinates: { latitude: 23.2599, longitude: 77.4126 } },
    { name: 'Visakhapatnam', state: 'Andhra Pradesh', coordinates: { latitude: 17.6868, longitude: 83.2185 } },
    { name: 'Pimpri-Chinchwad', state: 'Maharashtra', coordinates: { latitude: 18.6298, longitude: 73.7997 } },
    { name: 'Patna', state: 'Bihar', coordinates: { latitude: 25.5941, longitude: 85.1376 } },
    { name: 'Vadodara', state: 'Gujarat', coordinates: { latitude: 22.3072, longitude: 73.1812 } },
];

/**
 * Reverse geocode coordinates to get city, state, country using Google API
 * @param coords Coordinates to reverse geocode
 * @returns LocationData with city, state, country
 */
export async function reverseGeocode(coords: Coordinates): Promise<LocationData> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log('🌍 Reverse geocoding coordinates:', coords);

    if (!apiKey) {
        console.warn('⚠️ Google Maps API key not found, using coordinates only');
        return {
            coordinates: coords,
            city: `Location (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})`,
            country: 'India'
        };
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${apiKey}`;
        console.log('🌍 Calling Google Geocoding API...');

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
            console.error('❌ Geocoding failed:', data.status);
            throw new Error('Geocoding failed');
        }

        console.log('✅ Geocoding response:', data.results[0]);

        // Extract address components
        const result = data.results[0];
        let city = '';
        let state = '';
        let country = '';

        for (const component of result.address_components) {
            const types = component.types;

            if (types.includes('locality')) {
                city = component.long_name;
            } else if (types.includes('administrative_area_level_2') && !city) {
                city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                state = component.long_name;
            } else if (types.includes('country')) {
                country = component.long_name;
            }
        }

        const locationData: LocationData = {
            coordinates: coords,
            city: city || 'Unknown City',
            state: state,
            country: country || 'India',
            address: result.formatted_address
        };

        console.log('✅ Reverse geocoded to:', locationData);
        return locationData;
    } catch (error) {
        console.error('❌ Reverse geocoding error:', error);
        // Fallback to coordinates
        return {
            coordinates: coords,
            city: `Location (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})`,
            country: 'India'
        };
    }
}
