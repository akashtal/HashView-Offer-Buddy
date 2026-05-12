import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiStyle extends Document {
  name: string;
  slug: string;
  promptTemplate: string;
  negativePrompt?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AiStyleSchema = new Schema<IAiStyle>(
  {
    name: {
      type: String,
      required: [true, 'Style name is required'],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
    },
    promptTemplate: {
      type: String,
      required: [true, 'Prompt template is required'],
      maxlength: 1000,
    },
    negativePrompt: {
      type: String,
      maxlength: 1000,
      default:
        'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, jpeg artifacts, signature, watermark, username, blurry',
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

AiStyleSchema.index({ slug: 1 });
AiStyleSchema.index({ isActive: 1 });

const AiStyle: Model<IAiStyle> =
  mongoose.models.AiStyle || mongoose.model<IAiStyle>('AiStyle', AiStyleSchema);

export default AiStyle;
