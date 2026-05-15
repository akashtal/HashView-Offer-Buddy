import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiModel extends Document {
  name: string;
  gender: 'male' | 'female' | 'unisex';
  imageUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AiModelSchema = new Schema<IAiModel>(
  {
    name: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
      maxlength: 100,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex'],
      required: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Model image URL is required'],
    },
    thumbnailUrl: {
      type: String,
      default: '',
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

AiModelSchema.index({ isActive: 1 });
AiModelSchema.index({ gender: 1, isActive: 1 });

const AiModel: Model<IAiModel> =
  mongoose.models.AiModel || mongoose.model<IAiModel>('AiModel', AiModelSchema);

export default AiModel;
