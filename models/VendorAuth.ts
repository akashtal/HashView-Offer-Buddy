
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendorAuth extends Document {
    email: string;
    password?: string;
    businessName?: string;
    mobile?: string;
    gstNumber?: string;
    isVerified: boolean;
    role: 'vendor';
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: Date;
    rejectionReason?: string;
    isActive: boolean;
    storeId?: mongoose.Types.ObjectId;
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
        businessName: {
            type: String,
        },
        mobile: {
            type: String,
        },
        gstNumber: {
            type: String,
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
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        approvedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
        },
    },
    {
        timestamps: true,
    }
);

const VendorAuth: Model<IVendorAuth> = mongoose.models.VendorAuth || mongoose.model<IVendorAuth>('VendorAuth', VendorAuthSchema);

export default VendorAuth;
