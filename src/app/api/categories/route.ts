/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
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
