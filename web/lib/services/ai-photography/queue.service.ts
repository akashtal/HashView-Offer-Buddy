import type { EnhanceRequest } from '@/lib/services/ai-product.service';

type QueueRuntime = {
  queue: {
    add: (name: string, data: unknown, options?: unknown) => Promise<{ id?: string | number }>;
  };
};

let runtimePromise: Promise<QueueRuntime | null> | null = null;

export async function getAiEnhancementQueue(): Promise<QueueRuntime | null> {
  if (!process.env.REDIS_URL || process.env.AI_ENHANCE_QUEUE !== 'true') return null;
  if (!runtimePromise) runtimePromise = createRuntime();
  return runtimePromise;
}

export async function enqueueAiEnhancementJob(data: { request: EnhanceRequest; vendorId: string }) {
  const runtime = await getAiEnhancementQueue();
  if (!runtime) return null;

  return runtime.queue.add('enhance-product-image', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
    removeOnFail: { age: 60 * 60 * 24 * 7, count: 3000 },
  });
}

async function createRuntime(): Promise<QueueRuntime | null> {
  try {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const [{ Queue }, { default: IORedis }] = await Promise.all([
      dynamicImport('bullmq'),
      dynamicImport('ioredis'),
    ]);
    const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    const queue = new Queue('ai-product-photography', { connection });
    return { queue };
  } catch (error) {
    console.warn('[AI Queue] BullMQ unavailable; falling back to API-started Replicate jobs:', error);
    return null;
  }
}
