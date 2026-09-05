// seeders/seedSubCategories.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../src/models/categories.js';
import SubCategory from '../src/models/subcategories.js';

dotenv.config();

async function seedSubCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Fetch category IDs
    const category_male = await Category.findOne({ name: 'Male' });
    const category_female = await Category.findOne({ name: 'Female' });
    const category_kids = await Category.findOne({ name: 'Kids' });

    if (!category_male || !category_female || !category_kids) {
      throw new Error('❌ Required categories not found in DB');
    }

    const subCategories = [
      {
        name: 'Red Kediyu Set',
        categoryId: category_kids._id,
        imageUrl: '/dresses/kids/73_kids.jpg',
        serialNumber: 73,
        stock: 1,
        pricePerDay: 150,
        size: 'M'
      },
      {
        name: 'Blue Kediyu Set',
        categoryId: category_kids._id,
        imageUrl: '/dresses/kids/83_kids.jpg',
        serialNumber: 83,
        stock: 1,
        pricePerDay: 160,
        size: 'L'
      },
      {
        name: 'Pink Kediyu Set',
        categoryId: category_kids._id,
        imageUrl: '/dresses/kids/75_kids.jpg',
        serialNumber: 75,
        stock: 1,
        pricePerDay: 160,
        size: 'L'
      },
      {
        name: 'Yellow Kediyu Set',
        categoryId: category_male._id,
        imageUrl: '/dresses/kediya/67_man.jpg',
        serialNumber: 67,
        stock: 1,
        pricePerDay: 200,
        size: 'S'
      },
      {
        name: 'Black Kediyu Set',
        categoryId: category_male._id,
        imageUrl: '/dresses/kediya/63_man.jpg',
        serialNumber: 63,
        stock: 1,
        pricePerDay: 250,
        size: 'S'
      },
      {
        name: 'Blue Kediyu Set',
        categoryId: category_male._id,
        imageUrl: '/dresses/kediya/66_man.jpg',
        serialNumber: 66,
        stock: 1,
        pricePerDay: 200,
        size: 'S'
      },
      {
        name: 'Blue Chaniya Choli Set',
        categoryId: category_female._id,
        imageUrl: '/dresses/chaniya_choli/9_cc.jpg',
        serialNumber: 9,
        stock: 1,
        pricePerDay: 200,
        size: 'S'
      },
      {
        name: 'Mutli Color Chaniya Choli Set',
        categoryId: category_female._id,
        imageUrl: '/dresses/chaniya_choli/61_cc.jpg',
        serialNumber: 61,
        stock: 1,
        pricePerDay: 200,
        size: 'S'
      },
      {
        name: 'Blue and Pink Set',
        categoryId: category_female._id,
        imageUrl: '/dresses/chaniya_choli/62_cc.jpg',
        serialNumber: 62,
        stock: 1,
        pricePerDay: 200,
        size: 'S'
      },
    ];

    await SubCategory.insertMany(subCategories);
    console.log('✅ Subcategories seeded successfully');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error seeding subcategories:', error);
    process.exit(1);
  }
}

seedSubCategories();
