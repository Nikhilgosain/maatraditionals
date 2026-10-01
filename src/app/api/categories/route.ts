/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongo';
import Category from '@/models/categories';
import { MESSAGES, STATUS_CODE } from '@/utils/constant';

export async function GET() {
  try {
    await connectMongoDB();
    const categories = await Category.find({});
    return NextResponse.json({ success: true, data: categories, status: STATUS_CODE.SUCCESS, message: MESSAGES.CATEGORIES_FETCHED_SUCCESSFULLY });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || MESSAGES.INTERNAL_SERVER_ERROR, errorMessage: error, statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();

    const body = await req.json();
    const { name } = body;

    // Validate category name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, message: MESSAGES.CATEGORY_NAME_REQUIRED, status: STATUS_CODE.ERROR },
        { status: STATUS_CODE.ERROR }
      );
    }

    const trimmedName = name.trim();

    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: MESSAGES.CATEGORY_ALREADY_EXISTS, status: STATUS_CODE.CONFLICT },
        { status: STATUS_CODE.CONFLICT }
      );
    }

    // Create new category document in MongoDB
    const newCategory = new Category({
      name: trimmedName,
    });

    const savedCategory = await newCategory.save();

    return NextResponse.json(
      {
        success: true,
        message: MESSAGES.CATEGORY_CREATED_SUCCESSFULLY,
        data: savedCategory,
        status: STATUS_CODE.CREATED,
      },
      { status: STATUS_CODE.CREATED }
    );
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: MESSAGES.CATEGORY_ALREADY_EXISTS, status: STATUS_CODE.CONFLICT },
        { status: STATUS_CODE.CONFLICT }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: error.message || MESSAGES.INTERNAL_SERVER_ERROR,
        status: STATUS_CODE.INTERNAL_SERVER_ERROR,
      },
      { status: STATUS_CODE.INTERNAL_SERVER_ERROR }
    );
  }
}

