import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maarasgarbatraditionaldb';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@local').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'StrongPass123!';

async function run() {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });

  const users = mongoose.connection.db.collection('users');

  const existing = await users.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const now = new Date();

  const doc = {
    name: 'Admin',
    email: ADMIN_EMAIL,
    password: hashed,
    isAdmin: true,
    isSuperAdmin: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await users.insertOne(doc);
  console.log('Created admin user:', ADMIN_EMAIL);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error creating admin:', err);
  process.exit(1);
});
