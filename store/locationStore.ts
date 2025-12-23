import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  radius: number;
  address: string | null;
  city: string | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  setLocation: (lat: number, lon: number, address?: string, city?: string) => void;
  setRadius: (radius: number) => void;
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      latitude: null,
      longitude: null,
      radius: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_RADIUS || '5'),
      address: null,
      city: null,
      isLoading: false,
      error: null,
      hasPermission: false,

      setLocation: (lat: number, lon: number, address?: string, city?: string) => {
        set({
          latitude: lat,
          longitude: lon,
          address: address || null,
          city: city || null,
          hasPermission: true,
          error: null,
        });
      },

      setRadius: (radius: number) => {
        const maxRadius = parseFloat(process.env.NEXT_PUBLIC_MAX_RADIUS || '50');
        const validRadius = Math.min(Math.max(radius, 1), maxRadius);
        set({ radius: validRadius });
      },

      requestLocation: async () => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
          set({ 
            error: 'Geolocation is not supported by your browser',
            isLoading: false,
          });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              });
            }
          );

          const { latitude, longitude } = position.coords;

          // Reverse geocoding to get address (optional)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            const address = data.display_name || null;
            const city = data.address?.city || data.address?.town || data.address?.village || null;

            set({
              latitude,
              longitude,
              address,
              city,
              hasPermission: true,
              isLoading: false,
              error: null,
            });
          } catch (geocodeError) {
            // If geocoding fails, still save coordinates
            set({
              latitude,
              longitude,
              hasPermission: true,
              isLoading: false,
              error: null,
            });
          }
        } catch (error: any) {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }

          set({
            error: errorMessage,
            isLoading: false,
            hasPermission: false,
          });
        }
      },

      clearLocation: () => {
        set({
          latitude: null,
          longitude: null,
          address: null,
          city: null,
          hasPermission: false,
          error: null,
        });
      },
    }),
    {
      name: 'location-storage',
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        radius: state.radius,
        address: state.address,
        city: state.city,
        hasPermission: state.hasPermission,
      }),
    }
  )
);

