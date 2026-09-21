import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../src/models/categories.js';

dotenv.config({ path: '.env.local' });

async function seedCategories() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('✅ Connected to MongoDB');

  const categories = [
    { name: 'Boys Kediya' },
    { name: 'Girls Chaniya Choli' },
    { name: 'Boys Kids Kediya' },
    { name: 'Girls Kids Chaniya Choli' },
  ];

  for (const cat of categories) {
    const exists = await Category.findOne({ name: cat.name });
    if (!exists) {
      await Category.create(cat);
      console.log(`✅ Inserted category: ${cat.name}`);
    } else {
      console.log(`⚠️ Category already exists: ${cat.name}`);
    }
  }

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

seedCategories().catch((err) => {
  console.error('❌ Failed to seed categories', err);
});
