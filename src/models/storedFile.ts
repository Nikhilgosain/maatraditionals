import mongoose from 'mongoose';

const storedFileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
    size: { type: Number, required: true },
    uploadType: { type: String, enum: ['cloth', 'document'], required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.StoredFile || mongoose.model('StoredFile', storedFileSchema);