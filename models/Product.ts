import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  category: mongoose.Types.ObjectId;
  subcategory?: string;
  price?: {
    original?: number;
    discounted?: number;
    currency: string;
  };
  offer?: {
    type: 'percentage' | 'flat' | 'bogo' | 'other';
    value?: number;
    description: string;
    validFrom: Date;
    validUntil: Date;
  };
  tags?: string[];
  isActive: boolean;
  isFeatured: boolean;
  stock?: {
    available: boolean;
    quantity?: number;
  };
  analytics: {
    views: number;
    contacts: number;
    viewHistory: {
      date: Date;
      count: number;
    }[];
    contactHistory: {
      date: Date;
      count: number;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: 2000,
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one image is required',
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subcategory: {
      type: String,
    },
    price: {
      original: Number,
      discounted: Number,
      currency: {
        type: String,
        default: 'INR',
      },
    },
    offer: {
      type: {
        type: String,
        enum: ['percentage', 'flat', 'bogo', 'other'],
      },
      value: Number,
      description: String,
      validFrom: Date,
      validUntil: Date,
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    stock: {
      available: {
        type: Boolean,
        default: true,
      },
      quantity: Number,
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      contacts: {
        type: Number,
        default: 0,
      },
      viewHistory: [
        {
          date: {
            type: Date,
            default: Date.now,
          },
          count: {
            type: Number,
            default: 0,
          },
        },
      ],
      contactHistory: [
        {
          date: {
            type: Date,
            default: Date.now,
          },
          count: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProductSchema.index({ vendorId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ 'offer.validUntil': 1 });
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

