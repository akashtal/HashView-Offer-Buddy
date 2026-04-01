'use client';

import { MapPin, Navigation } from 'lucide-react-native';

interface VendorLocationMapProps {
    lat: number;
    lng: number;
    shopName: string;
    address?: string;
}

export default function VendorLocationMap({ lat, lng, shopName, address }: VendorLocationMapProps) {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    // Embed URL (no API key needed for basic embed)
    const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed&hl=en`;

    return (
        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            {/* Map iframe */}
            <div className="relative">
                <iframe
                    src={embedUrl}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${shopName} location`}
                    className="block"
                />
                {/* Clickable overlay that opens Google Maps */}
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10 cursor-pointer"
                    title="Open in Google Maps"
                    aria-label="Open vendor location in Google Maps"
                />
            </div>

            {/* Footer */}
            <div className="bg-white px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-start gap-1.5 min-w-0">
                    <MapPin size={13} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600 truncate">
                        {address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                    </p>
                </div>
                <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0"
                >
                    <Navigation size={11} />
                    Directions
                </a>
            </div>
        </div>
    );
}
