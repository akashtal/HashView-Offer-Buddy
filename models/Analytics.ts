import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  type: 'view' | 'contact' | 'call' | 'whatsapp' | 'directions';
  userId?: mongoose.Types.ObjectId;
  userLocation?: {
    type: string;
    coordinates: [number, number];
  };
  metadata?: {
    referrer?: string;
    device?: string;
    browser?: string;
  };
  createdAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    type: {
      type: String,
      enum: ['view', 'contact', 'call', 'whatsapp', 'directions'],
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number],
    },
    metadata: {
      referrer: String,
      device: String,
      browser: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AnalyticsSchema.index({ vendorId: 1, createdAt: -1 });
AnalyticsSchema.index({ productId: 1, createdAt: -1 });
AnalyticsSchema.index({ type: 1, createdAt: -1 });
AnalyticsSchema.index({ createdAt: -1 });

const Analytics: Model<IAnalytics> = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);

export default Analytics;

