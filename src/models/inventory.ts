import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true,
  },
  date: {
    type: String,
    required: true,
    match: /^\d{2}-\d{2}-\d{4}$/,
  },
  status: {
    type: String,
    enum: ['available', 'booked'],
    default: 'available',
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  returned_at: { 
    type: String, 
    match: /^\d{2}-\d{2}-\d{4}$/, 
    default: null 
  },
  deleted_at: { 
    type: String, 
    match: /^\d{2}-\d{2}-\d{4}$/, 
    default: null 
  },
  deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

inventorySchema.index({ subCategoryId: 1, date: 1 }, { unique: true });

export default mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
