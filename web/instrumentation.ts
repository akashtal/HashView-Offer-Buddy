/**
 * instrumentation.ts
 * Next.js instrumentation hook — runs once when the server starts.
 * Initializes the in-process cron job for vendor activity checks.
 *
 * NOTE: node-cron only works on long-running servers (local dev, VPS, Docker).
 * On Vercel (serverless), it is skipped — use Vercel Cron Jobs pointing to
 * /api/cron/check-vendor-activity instead.
 */

export async function register() {
  // Only run in the Node.js runtime (not edge), and NOT on Vercel
  const isVercel = !!process.env.VERCEL;

  if (process.env.NEXT_RUNTIME === 'nodejs' && !isVercel) {
    const { initCronJobs } = await import('./lib/cron');
    initCronJobs();
  } else if (isVercel) {
    console.log('[Cron] Vercel detected — skipping node-cron. Use Vercel Cron Jobs instead.');
  }
}
