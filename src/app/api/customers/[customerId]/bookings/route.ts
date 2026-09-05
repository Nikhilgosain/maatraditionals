// src/app/api/customers/[customerId]/bookings/route.ts
import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongo';
import Booking from '@/models/bookings';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await connectMongoDB();
    const customerId = (await params).customerId;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Get all bookings for the customer
    const bookings = await Booking.aggregate([
      { 
        $match: { 
          customerId: new mongoose.Types.ObjectId(customerId),
          deleted_at: null 
        } 
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: 'subCategoryId',
          foreignField: '_id',
          as: 'subCategory'
        }
      },
      { $unwind: '$subCategory' },
      {
        $lookup: {
          from: 'categories',
          localField: 'subCategory.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          fromDate: 1,
          toDate: 1,
          price: 1,
          payment_status: 1,
          received_by: 1,
          given_by: 1,
          notes: 1,
          payment_date: 1,
          paid_amount: 1,
          pending_amount: { $subtract: ['$price', '$paid_amount'] },
          'subCategory.name': 1,
          'subCategory.serialNumber': 1,
          'category.name': 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    // Calculate payment summary
    const paymentSummary = bookings.reduce((acc, booking) => {
      acc.totalAmount += booking.price;
      acc.paidAmount += booking.paid_amount || 0;
      acc.pendingAmount += (booking.price - (booking.paid_amount || 0));
      return acc;
    }, { totalAmount: 0, paidAmount: 0, pendingAmount: 0 });

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        paymentSummary
      }
    });

  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching customer bookings' },
      { status: 500 }
    );
  }
}

// Add a new endpoint to update payment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await connectMongoDB();
    const customerId = (await params).customerId;
    const { bookingId, amount, paymentDate, receivedBy } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(customerId) || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await Booking.findOne({
      _id: bookingId,
      customerId,
      deleted_at: null
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update payment
    const paidAmount = (booking.paid_amount || 0) + amount;
    const paymentStatus = paidAmount >= booking.price ? 'paid' : 
                        (paidAmount > 0 ? 'partial' : 'pending');

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          paid_amount: paidAmount,
          payment_status: paymentStatus,
          payment_date: paymentDate || new Date(),
          received_by: receivedBy || booking.received_by,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).populate('subCategoryId', 'name serialNumber')
     .populate({
       path: 'subCategoryId',
       populate: {
         path: 'categoryId',
         select: 'name'
       }
     });

    return NextResponse.json({
      success: true,
      data: updatedBooking
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating payment' },
      { status: 500 }
    );
  }
}