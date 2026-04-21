import mongoose, { Schema, Document } from 'mongoose';

export interface IShortLink extends Document {
  slug: string;
  originalUrl: string;
  password?: string;
  expiresAt?: Date;
  userId?: string;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShortLinkSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    originalUrl: { type: String, required: true },
    password: { type: String },
    expiresAt: { type: Date },
    userId: { type: String, index: true },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ShortLinkSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { expiresAt: { $type: 'date' } },
  }
);

export default mongoose.models.ShortLink || mongoose.model('ShortLink', ShortLinkSchema);
