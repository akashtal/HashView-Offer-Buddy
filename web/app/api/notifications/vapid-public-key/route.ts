import { NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    console.error('VAPID public key not found in environment variables.');
    return NextResponse.json(apiError('VAPID public key not configured'), { status: 500 });
  }

  return NextResponse.json(apiSuccess({ publicKey }));
}
