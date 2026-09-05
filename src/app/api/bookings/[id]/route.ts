/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMongoDB } from '@/lib/db/mongo';
import Booking from '@/models/bookings';
import Inventory from '@/models/inventory';
import mongoose from 'mongoose';
import '@/models/subcategories';
import '@/models/categories';
import '@/models/customers';
import { NextRequest } from 'next/server';
import { MESSAGES, STATUS_CODE } from '@/utils/constant';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    await connectMongoDB();

    if (!id) {
      return Response.json({ success: false, message: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await Booking.findById(id)
      .populate({
        path: 'customerId',
        model: 'Customer',
        select: 'fullName mobile address',
      })
      .populate({
        path: 'items.subCategoryId',
        model: 'SubCategory',
        select: 'name categoryId',
        populate: {
          path: 'categoryId',
          model: 'Category',
          select: 'name',
        },
      })
      .lean();
      
    if (!booking) {
      return Response.json({ success: false, message: MESSAGES.BOOKING_NOT_FOUND }, { status: STATUS_CODE.NOT_FOUND });
    }

    const responseData = {
        _id: (booking as any)._id,
        customer: (booking as any).customerId,
        items: (booking as any).items.map((item: any) => ({
            ...item,
            subCategory: item.subCategoryId,
        })),
        price: (booking as any).price,
        startDate: (booking as any).fromDate,
        endDate: (booking as any).toDate,
        payment_method: (booking as any).payment_method,
        payment_status: (booking as any).payment_status,
        total: (booking as any).price,
    };

    return Response.json({
      success: true,
      data: responseData,
    });

  } catch (error: any) {
    console.error(`GET /api/bookings/[id] error:`, error);
    return Response.json({ success: false, message: error.message || MESSAGES.INTERNAL_SERVER_ERROR }, { status: STATUS_CODE.INTERNAL_SERVER_ERROR });
  }
}

export async function PUT(req: Request) {
  await connectMongoDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const customerId = pathParts[pathParts.length - 1];
    const updates = await req.json();

    if (updates.fullName || updates.mobile || updates.address || updates.proof) {
      const updateData: any = {
        fullName: updates.fullName,
        mobile: updates.mobile,
        address: updates.address,
        updated_at: new Date()
      };

      if (updates.proof) {
        updateData.document_link = updates.proof;
      }

      await mongoose.model('Customer').findByIdAndUpdate(
        customerId,
        { $set: updateData },
        { session, new: true }
      );
    }

    const booking = await Booking.findOne({ customerId }).session(session);

    if (!booking) {
        await session.abortTransaction();
        return Response.json({ success: false, message: "Booking not found for this customer." }, { status: 404 });
    }

    // First, remove all existing inventory records for this booking
    await Inventory.deleteMany({ bookingId: booking._id }).session(session);

    const newBookingItems = [];
    for (const item of updates.bookings) {
      const existingItem = item._id
        ? booking.items.find((bookingItem: any) => bookingItem._id?.toString() === item._id)
        : null;
      const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };
      
      const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const startDate = parseDate(item.startDate);
      const endDate = parseDate(item.endDate);
      
      const datesToBook: Date[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        datesToBook.push(new Date(d));
      }

      const conflict = await Inventory.findOne({
        subCategoryId: item.subcategoryId,
        date: { $in: datesToBook.map(d => formatDate(d)) },
        bookingId: { $ne: booking._id } // Explicitly exclude the current booking
      }).session(session);

      if (conflict) {
        await session.abortTransaction();
        return Response.json({
          success: false,
          message: `Inventory not available. Item is booked by another customer on date: ${conflict.date}.`,
        }, { status: STATUS_CODE.CONFLICT });
      }

      newBookingItems.push({
        ...(existingItem?._id ? { _id: existingItem._id } : {}),
        subCategoryId: item.subcategoryId,
        serialNumber: item.serialNumber || existingItem?.serialNumber || '',
        fromDate: formatDate(startDate),
        toDate: formatDate(endDate),
        totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        price: item.price,
        status: existingItem?.status || 'active',
        given_by: existingItem?.given_by || '',
        received_by: existingItem?.received_by || '',
        given_at: existingItem?.given_at || null,
        received_at: existingItem?.received_at || null,
        cancelled_at: existingItem?.cancelled_at || null,
      });
    }

    await Booking.updateOne(
      { customerId },
      {
        $set: {
          items: newBookingItems,
          payment_method: updates.payment_method.toLowerCase(),
          payment_status: updates.payment_status.toLowerCase(),
          paidAt: updates.payment_status.toLowerCase() === 'paid' ? new Date() : null,
          bill_created_by: updates.bill_created_by || '',
          refered_by: updates.refered_by || '',
          paid_amount: updates.paid_amount || 0,
          pending_amount: updates.pending_amount || 0,
          total: updates.total || 0,
          updated_at: new Date()
        }
      },
      { session }
    );

    const updatedBooking = await Booking.findOne({ customerId }).session(session);
    const inventoryDocs = updatedBooking.items
      .filter((item: any) => item.status !== 'cancelled' && item.status !== 'received')
      .flatMap((item: any) => {
        const parseDate = (dateStr: string) => {
          const [day, month, year] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        const formatDate = (date: Date) => {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        };
        const dates = [];
        for (let d = parseDate(item.fromDate); d <= parseDate(item.toDate); d.setDate(d.getDate() + 1)) {
          dates.push({
            subCategoryId: item.subCategoryId,
            date: formatDate(new Date(d)),
            status: 'booked',
            customerId,
            bookingId: booking._id,
            itemId: item._id,
          });
        }
        return dates;
      });

    if (inventoryDocs.length) {
      await Inventory.insertMany(inventoryDocs, { session });
    }
    
    await session.commitTransaction();
    return Response.json({ success: true, message: MESSAGES.BOOKINGS_UPDATED_SUCCESSFULLY, statusCode: STATUS_CODE.SUCCESS });

  } catch (err: any) {
    await session.abortTransaction();
    return Response.json({ success: false, message: err.message || MESSAGES.INTERNAL_SERVER_ERROR, statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR });
  } finally {
    session.endSession();
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongoDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = await params;
    if (!id) {
      await session.abortTransaction();
      return Response.json({ 
        success: false, 
        message: 'Booking ID is required', 
        statusCode: STATUS_CODE.ERROR 
      });
    }

    const bookingIds = id.split(',').map(id => id.trim());
    
    // Validate ObjectId format
    if (bookingIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      await session.abortTransaction();
      return Response.json({ 
        success: false, 
        message: 'Invalid booking ID format', 
        statusCode: STATUS_CODE.ERROR 
      });
    }

    // Find bookings that aren't already deleted
    const foundBookings = await Booking.find({ 
      _id: { $in: bookingIds }, 
      deleted_at: null 
    }).session(session);

    if (foundBookings.length === 0) {
      await session.abortTransaction();
      return Response.json({ 
        success: false, 
        message: MESSAGES.BOOKING_NOT_FOUND, 
        statusCode: STATUS_CODE.NOT_FOUND 
      });
    }

    // Soft delete the bookings by setting deleted_at to current date
    await Booking.updateMany(
      { _id: { $in: bookingIds } },
      { 
        $set: { 
          deleted_at: new Date(),
          updated_at: new Date()
        } 
      },
      { session }
    );

    // Delete associated inventory records
    await Inventory.deleteMany(
      { bookingId: { $in: bookingIds } },
      { session }
    );

    await session.commitTransaction();
    return Response.json({ 
      success: true, 
      message: MESSAGES.BOOKINGS_DELETED_SUCCESSFULLY, 
      statusCode: STATUS_CODE.SUCCESS 
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error deleting bookings:', error);
    return Response.json({ 
      success: false, 
      message: error.message || MESSAGES.INTERNAL_SERVER_ERROR, 
      statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR 
    });
  } finally {
    await session.endSession();
  }
}
