
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendorAuth extends Document {
    email: string;
    password?: string;
    isVerified: boolean;
    role: 'vendor';
    createdAt: Date;
    updatedAt: Date;
}

const VendorAuthSchema = new Schema<IVendorAuth>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            default: 'vendor',
            enum: ['vendor'],
        },
    },
    {
        timestamps: true,
    }
);

const VendorAuth: Model<IVendorAuth> = mongoose.models.VendorAuth || mongoose.model<IVendorAuth>('VendorAuth', VendorAuthSchema);

export default VendorAuth;
