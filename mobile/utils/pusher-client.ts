import PusherClient from 'pusher-js';

const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER;

// Guard: only initialize if credentials are present (avoids crash on missing env vars)
export const pusherClient = PUSHER_KEY && PUSHER_CLUSTER
    ? new PusherClient(PUSHER_KEY, { cluster: PUSHER_CLUSTER })
    : null;
