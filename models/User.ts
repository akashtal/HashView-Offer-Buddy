import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'user' | 'vendor' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  preferences?: {
    radius: number; // in kilometers
    categories: mongoose.Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'vendor', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
      address: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    preferences: {
      radius: {
        type: Number,
        default: 5, // 5 km default
      },
      categories: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Category',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location
UserSchema.index({ 'location.coordinates': '2dsphere' });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

