/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMongoDB } from '@/lib/db/mongo';
import Booking from '@/models/bookings';
import Customer from '@/models/customers';
import mongoose from 'mongoose';
import '@/models/subcategories';
import '@/models/categories';
import '@/models/customers';
import { MESSAGES, STATUS_CODE } from '@/utils/constant';

// Define the structure of a single item within a booking
interface BookingItem {
  subCategoryId: any; // Using 'any' to accommodate populated fields
  serialNumber: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  price: number;
  status?: string;
  given_by?: string;
  received_by?: string;
}

// Define the overall structure of the booking document with its items
interface BookingWithItems {
  _id: mongoose.Types.ObjectId;
  customerId: any; // Using 'any' to accommodate populated fields
  items: BookingItem[];
  payment_method?: string;
  payment_status?: string;
  bill_created_by?: string;
  received_by?: string;
  paid_amount?: number;
  pending_amount?: number;
  refered_by?: string;
  total?: number;
}


export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectMongoDB();
    const customerId = (await params).id;

    const customer = await Customer.findById(customerId).lean();
    if (!customer) {
      return Response.json({ success: false, message: MESSAGES.CUSTOMER_NOT_FOUND }, { status: STATUS_CODE.NOT_FOUND });
    }

    // Explicitly type the result of the query
    const booking = await Booking.findOne({ customerId, deleted_at: null})
    .populate({
      path: 'items', // First, populate the 'items' array
      populate: { // Then, populate the 'subCategoryId' within each item
        path: 'subCategoryId',
        model: 'SubCategory',
        select: 'name categoryId serialNumber',
        populate: {
          path: 'categoryId',
          model: 'Category',
          select: 'name'
        }
      }
    })
    .lean() as BookingWithItems | null;

    if (!booking) {
      return Response.json({
        success: true,
        data: {
          customer: {
            _id: (customer as any)._id,
            fullName: (customer as any).fullName,
            mobile: (customer as any).mobile,
            address: (customer as any).address,
            proof: (customer as any).document_link
          },
          total: 0,
          payment_method: '',
          payment_status: '',
          price: 0,
          bookings: [],
          bill_created_by: '',
          received_by: '',
          paid_amount: 0,
          pending_amount: 0,
        }
      });
    }

    return Response.json({
      success: true,
      data: {
        customer: {
          _id: (customer as any)._id,
          fullName: (customer as any).fullName,
          mobile: (customer as any).mobile,
          address: (customer as any).address,
          proof: (customer as any).document_link
        },
        payment_method: booking.payment_method?.toLowerCase() || "cash",
        payment_status: booking.payment_status?.toLowerCase() || "unpaid",
        bill_created_by: booking.bill_created_by || '',
        received_by: booking.received_by || '',
        paid_amount: booking.paid_amount || 0,
        pending_amount: booking.pending_amount || 0,
        refered_by: booking.refered_by || '',
        total: booking.total || 0,
        bookings: booking.items.map((b: any) => {
          const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
              return dateStr;
            }
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
          };
          
          return {
            _id: b._id,
            categoryId: b.subCategoryId?.categoryId?._id,
            subcategoryId: b.subCategoryId?._id,
            category: b.subCategoryId?.categoryId?.name,
            subCategory: b.subCategoryId?.name || 'N/A',
            serialNumber: b.subCategoryId?.serialNumber || '',
            startDate: formatDate(b.fromDate),
            endDate: formatDate(b.toDate),
            price: b.price,
            status: b.status || 'active',
            given_by: b.given_by || '',
            received_by: b.received_by || '',
          };
        })
      },
      statusCode: STATUS_CODE.SUCCESS,
      message: MESSAGES.BOOKINGS_FETCHED_SUCCESSFULLY,
    });

  } catch (err: any) {
    return Response.json({ success: false, message: err.message || MESSAGES.INTERNAL_SERVER_ERROR }, { status: STATUS_CODE.INTERNAL_SERVER_ERROR });
  }
}
