import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    apiSuccess(null, 'Logout successful'),
    { status: 200 }
  );

  // Clear token cookie
  response.cookies.delete('token');

  return response;
}

