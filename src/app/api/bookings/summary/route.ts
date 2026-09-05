/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongo';
import Booking from '@/models/bookings';
import Customer from '@/models/customers';
import SubCategory from '@/models/subcategories';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const startDate = searchParams.get('startDate') || '';

    const skip = (page - 1) * limit;

    // Build the aggregation pipeline
    const pipeline: any[] = [];

    // Initial match for non-deleted bookings
    pipeline.push({ $match: { deleted_at: null } });

    // Customer search
    if (search) {
      const customers = await Customer.find({
        fullName: { $regex: search, $options: 'i' }
      }).select('_id').lean();
      const customerIds = customers.map(c => c._id);
      
      pipeline.push({ $match: { customerId: { $in: customerIds } } });
    }

    // Unwind the items array to treat each item as a separate document
    pipeline.push({ $unwind: '$items' });

    // Category and Date filtering on the unwound items
    const itemMatch: any = {};
    if (status) {
      itemMatch['items.status'] = status;
    }
    if (category && category !== 'all') {
      const subcategories = await SubCategory.find({ categoryId: new mongoose.Types.ObjectId(category) }).select('_id').lean();
      const subcategoryIds = subcategories.map(s => s._id);
      if (subcategoryIds.length > 0) {
        itemMatch['items.subCategoryId'] = { $in: subcategoryIds };
      } else {
        // No subcategories match, so no results
        pipeline.push({ $match: { _id: new mongoose.Types.ObjectId() } });
      }
    }

    if (startDate) {
        if (!/^\d{2}-\d{2}-\d{4}$/.test(startDate)) {
            return NextResponse.json({ success: false, message: 'Invalid date format. Please use DD-MM-YYYY' }, { status: 400 });
        }
        itemMatch['items.fromDate'] = startDate;
    }

    if (Object.keys(itemMatch).length > 0) {
      pipeline.push({ $match: itemMatch });
    }

    // Perform a count of the filtered items for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Booking.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    
    // Add sorting, skipping, and limiting for the final data fetch
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    // Populate related data
    pipeline.push({
      $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customerInfo' }
    });
    pipeline.push({ $unwind: '$customerInfo' });
    
    pipeline.push({
      $lookup: { from: 'subcategories', localField: 'items.subCategoryId', foreignField: '_id', as: 'items.subCategoryInfo' }
    });
    pipeline.push({ $unwind: '$items.subCategoryInfo' });

    pipeline.push({
        $lookup: { from: 'categories', localField: 'items.subCategoryInfo.categoryId', foreignField: '_id', as: 'items.categoryInfo' }
    });
    pipeline.push({ $unwind: '$items.categoryInfo' });

    const bookings = await Booking.aggregate(pipeline);

    // Format the response to be flat and easy for the frontend to use
    const formattedData = bookings.map(b => ({
      _id: b._id, // Booking ID
      itemId: b.items._id, // Item ID
      customerId: b.customerInfo,
      subCategoryId: {
        _id: b.items.subCategoryInfo._id,
        name: b.items.subCategoryInfo.name,
        serialNumber: b.items.subCategoryInfo.serialNumber,
        categoryId: {
          _id: b.items.categoryInfo._id,
          name: b.items.categoryInfo.name,
        }
      },
      bookingDate: b.createdAt,
      fromDate: b.items.fromDate,
      toDate: b.items.toDate,
      price: b.items.price,
      payment_status: b.payment_status,
      status: b.items.status || 'active',
      received_by: b.items.received_by || b.received_by,
      given_by: b.items.given_by || b.given_by,
      given_at: b.items.given_at,
      received_at: b.items.received_at,
      cancelled_at: b.items.cancelled_at,
    }));


    return NextResponse.json({
      success: true,
      statusCode: 200,
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching booking summary:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching booking summary' },
      { status: 500 }
    );
  }
}
