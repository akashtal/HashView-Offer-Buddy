import User from '@/models/User';
import { hashPassword } from '@/lib/password';

export async function bootstrapAdmin() {
    try {
        const adminEmail = 'admin@hashview.com';
        const adminPassword = 'admin123'; // Default password

        // Check if admin exists
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            console.log('⚡ Check: Admin account missing. Creating default admin...');

            const hashedPassword = await hashPassword(adminPassword);

            await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                phone: '+919999999999'
            });

            console.log('✅ Admin account created successfully.');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        } else {
            // Optional: Reset password if needed, or just log
            // console.log('✓ Admin account exists.');
        }
    } catch (error) {
        console.error('❌ Failed to bootstrap admin:', error);
    }
}
