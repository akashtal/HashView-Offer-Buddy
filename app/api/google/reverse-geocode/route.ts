import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';



export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        if (!lat || !lng) {
            return NextResponse.json(
                { error: 'lat and lng parameters are required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('❌ Google Maps API key not configured on server');
            return NextResponse.json(
                { error: 'Google Maps API key not configured' },
                { status: 500 }
            );
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        console.log('🌍 Calling Google Geocoding API from server...');

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
            console.error('❌ Geocoding failed on server:', data.status);
            return NextResponse.json(
                { error: `Geocoding failed: ${data.status}` },
                { status: 500 }
            );
        }

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

        return NextResponse.json({
            city: city || 'Unknown City',
            state: state,
            country: country || 'India',
            address: result.formatted_address,
            coordinates: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng)
            }
        });
    } catch (error) {
        console.error('Google Reverse Geocode error:', error);
        return NextResponse.json(
            { error: 'Failed to reverse geocode' },
            { status: 500 }
        );
    }
}
