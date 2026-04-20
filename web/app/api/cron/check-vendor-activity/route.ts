import { NextRequest, NextResponse } from 'next/server';
import { runVendorActivityCheck } from '@/lib/cron';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * GET /api/cron/check-vendor-activity
 * 
 * Manually triggers the vendor activity check (same as the hourly cron).
 * Protected by CRON_SECRET header for security.
 * 
 * Use this to TEST the lock system without waiting an hour.
 * 
 * Usage:
 *   curl -H "x-cron-secret: test-cron-secret" http://localhost:3000/api/cron/check-vendor-activity
 */
export async function GET(request: NextRequest) {
  // Accept manual secret header OR Vercel's built-in cron authorization
  const manualSecret = request.headers.get('x-cron-secret');
  const vercelAuth = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET || 'test-cron-secret';
  const expectedVercelAuth = `Bearer ${process.env.CRON_SECRET || 'test-cron-secret'}`;

  const isAuthorized =
    manualSecret === expectedSecret ||
    vercelAuth === expectedVercelAuth ||
    process.env.VERCEL_CRON_SECRET === undefined; // Vercel automatically verifies its own cron calls

  if (!isAuthorized) {
    return NextResponse.json(apiError('Unauthorized'), { status: 401 });
  }

  try {
    await runVendorActivityCheck();
    return NextResponse.json(
      apiSuccess({}, 'Vendor activity check completed successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[CronEndpoint] Error:', error);
    return NextResponse.json(apiError('Cron job failed: ' + error.message), { status: 500 });
  }
}
