
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function getVendorId() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const vendor = await mongoose.connection.db.collection('vendors').findOne({});
        if (vendor) {
            console.log('VALID_VENDOR_ID:', vendor._id.toString());
        } else {
            console.log('No vendors found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

getVendorId();
