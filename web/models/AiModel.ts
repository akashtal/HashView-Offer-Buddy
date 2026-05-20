import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiModel extends Document {
  name: string;
  gender: 'male' | 'female' | 'unisex';
  bodySegment: 'upper_body' | 'lower_body' | 'full_body';
  garmentCategories: Array<'upper_body' | 'lower_body' | 'dresses'>;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
  sortOrder: number;
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
    bodySegment: {
      type: String,
      enum: ['upper_body', 'lower_body', 'full_body'],
      required: true,
      default: 'upper_body',
    },
    garmentCategories: {
      type: [String],
      enum: ['upper_body', 'lower_body', 'dresses'],
      default: ['upper_body'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Model image URL is required'],
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 220,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 100,
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
AiModelSchema.index({ bodySegment: 1, gender: 1, isActive: 1 });
AiModelSchema.index({ sortOrder: 1, isActive: 1 });

const AiModel: Model<IAiModel> =
  mongoose.models.AiModel || mongoose.model<IAiModel>('AiModel', AiModelSchema);

export default AiModel;
