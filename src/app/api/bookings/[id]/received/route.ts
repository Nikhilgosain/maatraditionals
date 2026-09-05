import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongo';
import mongoose from 'mongoose';
import Booking from '@/models/bookings';   
import '@/models/inventory';
import { NextRequest } from 'next/server';

export async function PUT(
 req: NextRequest, { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoDB();
    
    const { id } = await params;
    const { received_by, given_by, status, itemId } = await req.json();
    const normalizedStatus = status === 'cancelled'
      ? 'cancelled'
      : status === 'given'
        ? 'given'
        : 'received';

    if (normalizedStatus === 'received' && !received_by) {
      return NextResponse.json(
        { success: false, message: 'Received by field is required' },
        { status: 400 }
      );
    }

    if (normalizedStatus === 'given' && !given_by) {
      return NextResponse.json(
        { success: false, message: 'Given by field is required' },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    const item = itemId
      ? booking.items.id(itemId)
      : null;

    if (itemId && !item) {
      return NextResponse.json(
        { success: false, message: 'Booking item not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    if (item) {
      item.status = normalizedStatus;
      if (normalizedStatus === 'given') {
        item.given_by = given_by;
        item.given_at = now;
      }
      if (normalizedStatus === 'received') {
        item.received_by = received_by;
        item.received_at = now;
      }
      if (normalizedStatus === 'cancelled') {
        item.cancelled_at = now;
      }

      const itemStatuses = booking.items.map((bookingItem: { status?: string }) => bookingItem.status || 'active');
      if (itemStatuses.every((itemStatus: string) => itemStatus === 'cancelled')) {
        booking.status = 'cancelled';
      } else if (itemStatuses.every((itemStatus: string) => itemStatus === 'received' || itemStatus === 'cancelled')) {
        booking.status = 'received';
      } else {
        booking.status = 'active';
      }

      await booking.save();
    }

    const updatedBooking = item
      ? await Booking.findById(id)
      : await Booking.findByIdAndUpdate(
        id,
        { 
          status: normalizedStatus === 'given' ? 'active' : normalizedStatus,
          given_by: normalizedStatus === 'cancelled' ? '' : given_by,
          received_by: normalizedStatus === 'cancelled' ? '' : received_by,
          updated_at: now,
        },
        { new: true, runValidators: true }
      )
    .populate('customerId', 'name phone address')
    .populate({
      path: 'subCategoryId',
      populate: {
        path: 'categoryId',
        select: 'name'
      }
    });

    if (!updatedBooking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    if ((normalizedStatus === 'received' || normalizedStatus === 'cancelled') && item) {
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
      const itemDates = [];
      for (let d = parseDate(item.fromDate); d <= parseDate(item.toDate); d.setDate(d.getDate() + 1)) {
        itemDates.push(formatDate(new Date(d)));
      }

      await mongoose.model('Inventory').updateMany(
        {
          bookingId: id,
          $or: [
            { itemId },
            {
              itemId: null,
              subCategoryId: item.subCategoryId,
              date: { $in: itemDates }
            }
          ]
        },
        { 
          $set: { 
            status: 'available',
            returned_at: now
          }
        }
      );
    } else if (normalizedStatus === 'received' || normalizedStatus === 'cancelled') {
      await mongoose.model('Inventory').updateMany(
        { bookingId: id },
        {
          $set: {
            status: 'available',
            returned_at: now
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: normalizedStatus === 'cancelled'
        ? 'Booking cancelled successfully and items marked as available'
        : normalizedStatus === 'given'
          ? 'Item marked as given successfully'
          : 'Received by updated successfully and items marked as available',
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating received by:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating received by', statusCode: 500 },
      { status: 500 }
    );
  }
}
