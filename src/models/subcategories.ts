import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true }, 
  serialNumber: Number,
  deleted_at: { type: Date, default: null },
  deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export default mongoose.models.SubCategory || mongoose.model('SubCategory', subCategorySchema);
