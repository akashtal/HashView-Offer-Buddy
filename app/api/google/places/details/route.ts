import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const placeId = searchParams.get('placeId');

        if (!placeId) {
            return NextResponse.json(
                { error: 'placeId parameter is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Google Places API key not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,address_components&key=${apiKey}`
        );

        const data = await response.json();

        if (data.status !== 'OK') {
            return NextResponse.json(
                { error: `Google Places API error: ${data.status}` },
                { status: 500 }
            );
        }

        const result = data.result;
        const location = result.geometry?.location;

        // Extract address components
        const addressComponents = result.address_components || [];
        const getComponent = (type: string) => {
            return addressComponents.find((c: any) => c.types.includes(type))?.long_name || '';
        };

        return NextResponse.json({
            formattedAddress: result.formatted_address,
            coordinates: location ? [location.lng, location.lat] : null,
            city: getComponent('locality') || getComponent('administrative_area_level_2'),
            state: getComponent('administrative_area_level_1'),
            country: getComponent('country'),
            pincode: getComponent('postal_code'),
            placeId,
        });
    } catch (error) {
        console.error('Google Places Details error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch place details' },
            { status: 500 }
        );
    }
}
