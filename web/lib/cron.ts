/**
 * cron.ts
 * In-process cron jobs using node-cron.
 * Initialized once via instrumentation.ts when the Next.js server starts.
 *
 * Jobs:
 *  - Every hour: lock vendors inactive for >24h and send push notifications
 *  - Every hour: send reminder to vendors inactive for 20-24h
 */

import cron from 'node-cron';
import dbConnect from './mongodb';
import Store from '@/models/Store';
import { sendNotificationToVendors } from './notification.service';

const LOCK_THRESHOLD_HOURS = 24;
const REMINDER_THRESHOLD_HOURS = 20;

let isInitialized = false;

export function initCronJobs() {
  if (isInitialized) return;
  isInitialized = true;

  console.log('[Cron] Initializing vendor activity cron jobs...');

  // Run every hour at the top of the hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running vendor activity check...');
    try {
      await runVendorActivityCheck();
    } catch (error) {
      console.error('[Cron] Error in vendor activity check:', error);
    }
  });

  console.log('[Cron] Vendor activity cron scheduled (every hour).');
}

export async function runVendorActivityCheck() {
  await dbConnect();

  const now = new Date();
  const lockCutoff = new Date(now.getTime() - LOCK_THRESHOLD_HOURS * 60 * 60 * 1000);
  const reminderCutoff = new Date(now.getTime() - REMINDER_THRESHOLD_HOURS * 60 * 60 * 1000);

  // ────────────────────────────────────────────────
  // 1. LOCK vendors inactive for >24h
  // ────────────────────────────────────────────────
  const vendorsToLock = await Store.find({
    isLocked: false,
    isActive: true,
    lastActive: { $lt: lockCutoff },
  }).select('_id vendorId shopName');

  if (vendorsToLock.length > 0) {
    console.log(`[Cron] Locking ${vendorsToLock.length} inactive vendor(s)...`);

    const storeIds = vendorsToLock.map((v) => v._id);
    const vendorIds = vendorsToLock.map((v) => v.vendorId);

    // Bulk lock
    await Store.updateMany(
      { _id: { $in: storeIds } },
      { $set: { isLocked: true } }
    );

    // Send push notification to each locked vendor
    await sendNotificationToVendors(
      vendorIds,
      '🔒 Profile Locked',
      'Your vendor profile has been locked due to inactivity. Open the app to unlock and stay visible to customers.',
      { type: 'VENDOR_LOCKED', action: 'unlock' }
    );

    console.log(`[Cron] Locked ${vendorsToLock.length} vendor(s) and sent notifications.`);
  }

  // ────────────────────────────────────────────────
  // 2. REMIND vendors approaching the 24h mark (20-24h inactive range)
  // ────────────────────────────────────────────────
  const vendorsToRemind = await Store.find({
    isLocked: false,
    isActive: true,
    lastActive: { $lt: reminderCutoff, $gte: lockCutoff },
  }).select('_id vendorId shopName');

  if (vendorsToRemind.length > 0) {
    console.log(`[Cron] Sending reminders to ${vendorsToRemind.length} vendor(s)...`);

    const vendorIds = vendorsToRemind.map((v) => v.vendorId);

    await sendNotificationToVendors(
      vendorIds,
      '⏰ Stay Active!',
      'You have been inactive for over 20 hours. Log in now to keep your business visible to customers.',
      { type: 'VENDOR_REMINDER', action: 'open_app' }
    );

    console.log(`[Cron] Sent reminders to ${vendorsToRemind.length} vendor(s).`);
  }
}
