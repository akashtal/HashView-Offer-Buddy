/**
 * instrumentation.ts
 * Next.js instrumentation hook — runs once when the server starts.
 * Used to initialize the in-process cron job for vendor activity checks.
 * 
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run in the Node.js runtime (not edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initCronJobs } = await import('./lib/cron');
    initCronJobs();
  }
}
