import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendorSubcategory extends Document {
    _id: mongoose.Types.ObjectId;
    storeId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    parentCategory: mongoose.Types.ObjectId;
    productCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const VendorSubcategorySchema = new Schema<IVendorSubcategory>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Subcategory name is required'],
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        parentCategory: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        productCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
VendorSubcategorySchema.index({ storeId: 1 });
VendorSubcategorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
VendorSubcategorySchema.index({ parentCategory: 1 });

// Pre-save hook to generate slug
VendorSubcategorySchema.pre('save', function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

// Force model recompilation in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models['VendorSubcategory'];
}

const VendorSubcategory: Model<IVendorSubcategory> =
    mongoose.models.VendorSubcategory ||
    mongoose.model<IVendorSubcategory>('VendorSubcategory', VendorSubcategorySchema);

export default VendorSubcategory;
