/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongo';
import Booking from '@/models/bookings';
import Customer from '@/models/customers';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const pendingOnly = searchParams.get('pendingOnly') === 'true';
    const skip = (page - 1) * limit;

    const matchStage: any = {
      deleted_at: null,
    };

    if (search) {
      const customers = await Customer.find({
        fullName: { $regex: search, $options: 'i' },
      }).select('_id');
      const customerIds = customers.map((c) => c._id);
      matchStage.customerId = { $in: customerIds };
    }

    if (pendingOnly) {
      matchStage.pending_amount = { $gt: 0 };
    }

    const total = await Booking.countDocuments(matchStage);

    const payments = await Booking.find(matchStage)
      .populate('customerId', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const aggregates = await Booking.aggregate([
      { $match: pendingOnly ? { deleted_at: null, pending_amount: { $gt: 0 } } : { deleted_at: null } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          totalPaid: { $sum: '$paid_amount' },
          totalPending: { $sum: '$pending_amount' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        aggregates: aggregates[0] || { totalAmount: 0, totalPaid: 0, totalPending: 0 },
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching payments' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
    try {
        await connectMongoDB();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const { paid_amount, payment_date, note } = await request.json();

        if (!id) {
            return NextResponse.json({ success: false, message: 'Payment ID is required' }, { status: 400 });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json({ success: false, message: 'Payment record not found' }, { status: 404 });
        }

        const previousPaidAmount = Number(booking.paid_amount || 0);
        const nextPaidAmount = Number(paid_amount || 0);
        const paymentIncrease = Math.max(0, nextPaidAmount - previousPaidAmount);

        booking.paid_amount = nextPaidAmount;
        booking.pending_amount = booking.total - paid_amount;
        booking.payment_status = booking.pending_amount <= 0 ? 'paid' : 'partial';

        if (paymentIncrease > 0) {
            const fallbackDate = new Date().toLocaleDateString('en-GB').split('/').join('-');
            booking.payment_history = [
                ...(booking.payment_history || []),
                {
                    amount: paymentIncrease,
                    payment_date: payment_date || fallbackDate,
                    note: note || '',
                },
            ];
        }

        await booking.save();

        return NextResponse.json({ success: true, message: 'Payment updated successfully', data: booking });

    } catch (error) {
        console.error('Error updating payment:', error);
        return NextResponse.json({ success: false, message: 'Error updating payment' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await connectMongoDB();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Payment ID is required' }, { status: 400 });
        }

        await Booking.findByIdAndUpdate(id, { deleted_at: new Date() });

        return NextResponse.json({ success: true, message: 'Payment record deleted successfully' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        return NextResponse.json({ success: false, message: 'Error deleting payment' }, { status: 500 });
    }
}
