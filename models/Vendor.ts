import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  shopName: string;
  shopDescription?: string;
  shopLogo?: string;
  shopImages?: string[];
  category: mongoose.Types.ObjectId;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  contactInfo: {
    phone: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  };
  businessHours?: {
    day: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
  isApproved: boolean;
  isActive: boolean;
  rating?: number;
  totalReviews?: number;
  analytics: {
    totalViews: number;
    totalContacts: number;
    totalProducts: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    shopDescription: {
      type: String,
      maxlength: 1000,
    },
    shopLogo: {
      type: String,
    },
    shopImages: [
      {
        type: String,
      },
    ],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        default: 'India',
      },
      pincode: {
        type: String,
        required: true,
      },
    },
    contactInfo: {
      phone: {
        type: String,
        required: true,
      },
      whatsapp: String,
      email: String,
      website: String,
    },
    businessHours: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        openTime: String,
        closeTime: String,
        isClosed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isApproved: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    analytics: {
      totalViews: {
        type: Number,
        default: 0,
      },
      totalContacts: {
        type: Number,
        default: 0,
      },
      totalProducts: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
VendorSchema.index({ 'location.coordinates': '2dsphere' });
VendorSchema.index({ userId: 1 });
VendorSchema.index({ category: 1 });
VendorSchema.index({ isApproved: 1, isActive: 1 });
VendorSchema.index({ 'location.city': 1 });

const Vendor: Model<IVendor> = mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor;

