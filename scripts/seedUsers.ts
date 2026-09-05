import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: 'superadmin@maarasgarba.com' });
    if (existing) {
      console.log('⚠️ Default users already seeded');
      return process.exit(0);
    }

    const superAdminPassword = await bcrypt.hash('Sup3r@dm!n#2025!', 10);
    const adminPasswords = [
      await bcrypt.hash('Adm!n#User1@2025$', 10),
      await bcrypt.hash('Adm!n#User2@2025$', 10),
      await bcrypt.hash('Adm!n#User3@2025$', 10),
      await bcrypt.hash('Adm!n#User4@2025$', 10),
      await bcrypt.hash('Adm!n#User5@2025$', 10),
    ];

    const users = [
      {
        name: 'Super Admin',
        email: 'superadmin@maarasgarba.com',
        password: superAdminPassword,
        isSuperAdmin: true,
        isAdmin: true,
      },
      {
        name: 'Admin User 1',
        email: 'user1@maarasgarba.com',
        password: adminPasswords[0],
        isAdmin: true,
      },
      {
        name: 'Admin User 2',
        email: 'user2@maarasgarba.com',
        password: adminPasswords[1],
        isAdmin: true,
      },
      {
        name: 'Admin User 3',
        email: 'user3@maarasgarba.com',
        password: adminPasswords[2],
        isAdmin: true,
      },
      {
        name: 'Admin User 4',
        email: 'user4@maarasgarba.com',
        password: adminPasswords[3],
        isAdmin: true,
      },
      {
        name: 'Admin User 5',
        email: 'user5@maarasgarba.com',
        password: adminPasswords[4],
        isAdmin: true,
      },
    ];

    await User.insertMany(users);
    console.log('✅ 6 users seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed users:', err);
    process.exit(1);
  }
}

seedUsers();
