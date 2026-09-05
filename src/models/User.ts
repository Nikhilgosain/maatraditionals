import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string; // Hashed
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    // Role flags
    isAdmin: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false },

    // Optional soft delete
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent model overwrite in dev
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
