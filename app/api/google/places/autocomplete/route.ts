import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const input = searchParams.get('input');

        if (!input) {
            return NextResponse.json(
                { error: 'Input parameter is required' },
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
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                input
            )}&components=country:in&key=${apiKey}`
        );

        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            return NextResponse.json(
                { error: `Google Places API error: ${data.status}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            predictions: data.predictions || [],
        });
    } catch (error) {
        console.error('Google Places Autocomplete error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch address suggestions' },
            { status: 500 }
        );
    }
}
