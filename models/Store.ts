import mongoose, { Schema, Document, Model } from 'mongoose';
import './Category';

export interface IStore extends Document {
  vendorId: mongoose.Types.ObjectId;
  shopName: string;
  shopDescription?: string;
  shopLogo?: string;
  shopImages?: string[];
  category: mongoose.Types.ObjectId;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    coordinates?: {
      type: string;
      coordinates: [number, number];
    };
    googlePlaceId?: string;
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

const StoreSchema = new Schema<IStore>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorAuth',
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
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          validate: {
            validator: function (v: number[]) {
              return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
            },
            message: 'Coordinates must be [longitude, latitude] with valid ranges',
          },
        },
      },
      googlePlaceId: {
        type: String,
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
StoreSchema.index({ 'location.coordinates': '2dsphere' });

StoreSchema.index({ vendorId: 1 });
StoreSchema.index({ category: 1 });
StoreSchema.index({ isApproved: 1, isActive: 1 });
StoreSchema.index({ 'location.city': 1 });

const Store: Model<IStore> = mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);

export default Store;


