import mongoose, { Schema, Document, Model } from 'mongoose';
import './Category'; // Ensure Category model is registered
import './VendorSubcategory'; // Ensure VendorSubcategory model is registered
import './Store'; // Ensure Store model is registered

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
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
      ref: 'Store',
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
      type: Schema.Types.ObjectId,
      ref: 'VendorSubcategory',
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
        enum: ['percentage', 'flat', 'bogo', 'other', 'clearance', 'discount'],
      },
      value: Number,
      description: String,
      validFrom: {
        type: Date,
        default: Date.now
      },
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

// Force model recompilation in development to handle schema changes
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models['Product'];
}

// Indexes for performance
ProductSchema.index({ vendorId: 1, isActive: 1, createdAt: -1 }); // Vendor profile default view
ProductSchema.index({ category: 1, isActive: 1 }); // Category pages
ProductSchema.index({ 'price.original': 1 }); // Price sort/filter
ProductSchema.index({ 'price.discounted': 1 }); // Discounted price sort/filter
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' }); // Text search
ProductSchema.index({ isFeatured: 1 }); // Featured products
ProductSchema.index({ 'offer.validUntil': 1 }); // Offer validity

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

