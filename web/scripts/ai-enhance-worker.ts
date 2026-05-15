import dotenv from 'dotenv';
dotenv.config();

import { enhanceProductImage, type EnhanceRequest } from '../lib/services/ai-product.service';

async function main() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required to run the AI enhancement worker');
  }

  const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
  const [{ Worker }, { default: IORedis }] = await Promise.all([
    dynamicImport('bullmq'),
    dynamicImport('ioredis'),
  ]);

  const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  const worker = new Worker(
    'ai-product-photography',
    async (job: { data: { request: EnhanceRequest; vendorId: string } }) => {
      const { request, vendorId } = job.data;
      return enhanceProductImage(request, vendorId);
    },
    {
      connection,
      concurrency: Number(process.env.AI_ENHANCE_WORKER_CONCURRENCY || 2),
      limiter: {
        max: Number(process.env.AI_ENHANCE_WORKER_RATE_LIMIT || 6),
        duration: 60_000,
      },
    }
  );

  worker.on('completed', (job: { id: string }) => console.log(`[AI Worker] Completed job ${job.id}`));
  worker.on('failed', (job: { id?: string } | undefined, error: Error) => {
    console.error(`[AI Worker] Failed job ${job?.id || 'unknown'}:`, error);
  });

  console.log('[AI Worker] Listening on ai-product-photography');
}

main().catch((error) => {
  console.error('[AI Worker] Fatal error:', error);
  process.exit(1);
});
