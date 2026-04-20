import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationToken extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'vendor' | 'user';
  token: string; // Expo Push Token format: ExponentPushToken[xxx]
  platform: 'android' | 'ios' | 'web';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTokenSchema = new Schema<INotificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['vendor', 'user'],
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ['android', 'ios', 'web'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

NotificationTokenSchema.index({ userId: 1, userType: 1 });
// Note: token field already has unique: true inline — no need for a separate index call

const NotificationToken: Model<INotificationToken> =
  mongoose.models.NotificationToken ||
  mongoose.model<INotificationToken>('NotificationToken', NotificationTokenSchema);

export default NotificationToken;
