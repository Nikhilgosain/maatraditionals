import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env.local');
  process.exit(1);
}

const usersToCreate = [
  {
    name: 'Super Admin',
    email: 'superadmin@maarasgarba.com',
    rawPassword: process.env.ADMIN_PASSWORD || 'Sup3r@dm!n',
    isAdmin: true,
    isSuperAdmin: true,
  },
  {
    name: 'Admin User 1',
    email: 'user1@maarasgarba.com',
    rawPassword: 'User1@123',
    isAdmin: true,
    isSuperAdmin: false,
  },
  {
    name: 'Admin User 2',
    email: 'user2@maarasgarba.com',
    rawPassword: 'User2@123',
    isAdmin: true,
    isSuperAdmin: false,
  },
  {
    name: 'Admin User 3',
    email: 'user3@maarasgarba.com',
    rawPassword: 'User3@123',
    isAdmin: true,
    isSuperAdmin: false,
  },
];

async function createUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const usersCollection = mongoose.connection.db.collection('users');

    for (const u of usersToCreate) {
      const emailLower = u.email.toLowerCase().trim();
      const existing = await usersCollection.findOne({ email: emailLower });
      const hashedPassword = await bcrypt.hash(u.rawPassword, 10);
      const now = new Date();

      if (existing) {
        // Update password & roles to ensure active credentials
        await usersCollection.updateOne(
          { _id: existing._id },
          {
            $set: {
              name: u.name,
              password: hashedPassword,
              isAdmin: u.isAdmin,
              isSuperAdmin: u.isSuperAdmin,
              updatedAt: now,
              deletedAt: null,
            },
          }
        );
        console.log(`🔄 Updated user: ${emailLower} (Password: ${u.rawPassword})`);
      } else {
        await usersCollection.insertOne({
          name: u.name,
          email: emailLower,
          password: hashedPassword,
          isAdmin: u.isAdmin,
          isSuperAdmin: u.isSuperAdmin,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        });
        console.log(`✅ Created user: ${emailLower} (Password: ${u.rawPassword})`);
      }
    }

    const allUsers = await usersCollection.find({ deletedAt: null }).toArray();
    console.log('\n--- Active Users in Database ---');
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. Name: ${u.name} | Email: ${u.email} | isAdmin: ${u.isAdmin} | isSuperAdmin: ${u.isSuperAdmin}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
}

createUsers();
