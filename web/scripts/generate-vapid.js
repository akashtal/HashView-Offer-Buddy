const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('\n✅ VAPID Keys Generated Successfully!\n');
console.log('Add these to your web/.env file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\n');
