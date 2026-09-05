import mongoose from 'mongoose';

const bookingItemSchema = new mongoose.Schema({
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
  serialNumber: { type: String, default: '' },
  fromDate: { type: String, required: true, match: /^\d{2}-\d{2}-\d{4}$/ },
  toDate: { type: String, required: true, match: /^\d{2}-\d{2}-\d{4}$/ },
  totalDays: { type: Number },
  price: { type: Number, required: true },
  status: { type: String, enum: ['active', 'given', 'received', 'cancelled'], default: 'active' },
  given_by: { type: String, required: false, default: '' },
  received_by: { type: String, required: false, default: '' },
  given_at: { type: Date, default: null },
  received_at: { type: Date, default: null },
  cancelled_at: { type: Date, default: null },
});

const paymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  payment_date: { type: String, required: true, match: /^\d{2}-\d{2}-\d{4}$/ },
  note: { type: String, default: '' },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [bookingItemSchema],
  payment_method: { type: String, enum: ['cash', 'upi'], default: 'cash' },
  payment_status: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
  status: { type: String, enum: ['active', 'received', 'cancelled'], default: 'active' },
  paidAt: { type: String, match: /^\d{2}-\d{2}-\d{4}$/ },
  payment_history: { type: [paymentHistorySchema], default: [] },
  received_by: { type: String, required: false },
  given_by: { type: String, required: false },
  bill_created_by: { type: String, required: false },
  total: {type: Number, required: false, default: 0},
  paid_amount: { type: Number, required: false, default: 0},
  pending_amount: { type: Number, required: false, default: 0},
  refered_by : { type: String, required: false },
  notes: { type: String, default: '' },
  deleted_at: { type: String, match: /^\d{2}-\d{2}-\d{4}$/, default: null },
  deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

}, { timestamps: true });

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
