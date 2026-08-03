const { MongoClient } = require('mongodb');
const uri = ';

async function main() {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('OfferBuddy');
    const users = await db.collection('users').find({ email: 'djtalukdar290@gmail.com' }).toArray();
    console.log(`Found ${users.length} users with this email.`);
    users.forEach(u => {
        console.log(`_id: ${u._id}, role: ${u.role}, isActive: ${u.isActive}, isVerified: ${u.isVerified}, password length: ${u.password.length}, password hash: ${u.password}`);
    });
    await client.close();
    process.exit(0);
}
main().catch(console.error);
