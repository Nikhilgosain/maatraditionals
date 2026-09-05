  /* eslint-disable @typescript-eslint/no-explicit-any */

  import Customer from '@/models/customers';
  import Booking from '@/models/bookings';
  import Inventory from '@/models/inventory';
  import { connectMongoDB } from '@/lib/db/mongo';
  import '@/models/subcategories';
  import '@/models/categories';
  import { MESSAGES, STATUS_CODE } from '@/utils/constant';

  // export async function POST(req: Request) {
  //   try {
  //     await connectMongoDB();

  //     // 1. Parse JSON body
  //     const {
  //       fullName,
  //       mobile,
  //       address,
  //       proof,
  //       total,
  //       payment_method,
  //       payment_status,
  //       bookings,
  //       bill_created_by,
  //       received_by,
  //       paid_amount,
  //       pending_amount,
  //       refered_by

  //     } = await req.json();

  //     // Create or update customer
  //     let customer = await Customer.findOne({ mobile });
  //     if (!customer) {
  //       customer = await Customer.create({
  //         fullName,
  //         mobile,
  //         address,
  //         document_link: proof || null,
  //         total_amount: total,
  //       });
  //     }

  //     // Create bookings and block inventory
  //     for (const item of bookings) {
  //       // Parse DD-MM-YYYY dates
  //       const parseDate = (dateStr: string) => {
  //         const [day, month, year] = dateStr.split('-').map(Number);
  //         return new Date(year, month - 1, day);
  //       };

  //       // Format date as DD-MM-YYYY for storage
  //       const formatDate = (date: Date) => {
  //         const day = String(date.getDate()).padStart(2, '0');
  //         const month = String(date.getMonth() + 1).padStart(2, '0');
  //         const year = date.getFullYear();
  //         return `${day}-${month}-${year}`;
  //       };

  //       const fromDate = parseDate(item.startDate);
  //       const toDate = parseDate(item.endDate);

  //       const allBookedItems = await Inventory.find({
  //         subCategoryId: item.subcategoryId,
  //         status: 'booked',
  //         $or: [
  //           { deleted_at: { $exists: false } },
  //           { deleted_at: null },
  //           { deleted_at: { $gt: new Date().toLocaleDateString('en-GB').split('/').join('-') } }
  //         ]
  //       });

  //       const existingBookings = allBookedItems.filter(bookedItem => {
  //         if (bookedItem.date === item.startDate) return true;
  //         const parseDDMMYYYY = (dateStr: string) => {
  //           const [day, month, year] = dateStr.split('-').map(Number);
  //           return new Date(year, month - 1, day);
  //         };
  //         const bookedDate = parseDDMMYYYY(bookedItem.date);
  //         const start = parseDDMMYYYY(item.startDate);
  //         const end = parseDDMMYYYY(item.endDate);
  //         return bookedDate > start && bookedDate < end;
  //       });

  //       if (existingBookings.length > 0) {
  //         throw new Error(`This item is already booked for the selected dates. Please choose different dates.`);
  //       }

  //       const timeDiff = toDate.getTime() - fromDate.getTime();
  //       const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

  //       const booking = await Booking.create({
  //         customerId: customer._id,
  //         subCategoryId: item.subcategoryId,
  //         serialNumber: item.serialNumber || '',
  //         fromDate: formatDate(fromDate),
  //         toDate: formatDate(toDate),
  //         totalDays,
  //         price: item.price,
  //         payment_method: payment_method.toLowerCase(),
  //         payment_status: payment_status.toLowerCase(),
  //         paidAt: payment_status.toLowerCase() === 'paid' ? formatDate(new Date()) : null,
  //         received_by,
  //         bill_created_by,
  //         paid_amount,
  //         pending_amount,
  //         refered_by,
  //         total
  //       });

  //       // --- INVENTORY BLOCKING (THE FIX) ---
  //       const inventoryDates = [];
  //       const currentDate = new Date(fromDate);
  //       const endDate = new Date(toDate);

  //       // If it's a single-day booking, book that one day.
  //       if (currentDate.getTime() === endDate.getTime()) {
  //         inventoryDates.push({
  //           subCategoryId: item.subcategoryId,
  //           serialNumber: item.serialNumber || '',
  //           date: formatDate(currentDate),
  //           status: 'booked',
  //           customerId: customer._id,
  //           bookingId: booking._id,
  //         });
  //       } else {
  //         // For multi-day bookings, book up to the day BEFORE the end date.
  //         while (currentDate < endDate) {
  //           inventoryDates.push({
  //             subCategoryId: item.subcategoryId,
  //             serialNumber: item.serialNumber || '',
  //             date: formatDate(currentDate),
  //             status: 'booked',
  //             customerId: customer._id,
  //             bookingId: booking._id,
  //           });
  //           currentDate.setDate(currentDate.getDate() + 1);
  //         }
  //       }

  //       if (inventoryDates.length > 0) {
  //         await Inventory.insertMany(inventoryDates, { ordered: false }).catch(() => { });
  //       }
  //     }

  //     return Response.json({ success: true, message: MESSAGES.BOOKINGS_CREATED_SUCCESSFULLY, statusCode: STATUS_CODE.SUCCESS });
  //   } catch (error: any) {
  //     console.error('Booking Error:', error);
  //     return Response.json(
  //       { success: false, message: error.message || MESSAGES.INTERNAL_SERVER_ERROR, statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR },
  //       { status: STATUS_CODE.INTERNAL_SERVER_ERROR }
  //     );
  //   }
  // }

  export async function POST(req: Request) {
    try {
      await connectMongoDB();

      const {
        fullName,
        mobile,
        address,
        proof,
        total,
        payment_method,
        payment_status,
        bookings, // This is the array of items from the frontend
        bill_created_by,
        received_by,
        paid_amount,
        pending_amount,
        refered_by
      } = await req.json();

      // Create or update customer
      let customer = await Customer.findOne({ mobile });
      if (!customer) {
        customer = await Customer.create({
          fullName,
          mobile,
          address,
          document_link: proof || null,
          total_amount: total,
        });
      }

      const bookingItems = [];

      // Helper to parse dates
      const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };
      
      // Helper to format dates
      const formatDate = (date: Date) => {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
      };

      // Loop through the items from the request and prepare them for the new schema
      for (const item of bookings) {
        const fromDate = parseDate(item.startDate);
        const toDate = parseDate(item.endDate);

        // Inventory conflict check
        const datesToCheck = [];
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
          datesToCheck.push(formatDate(new Date(d)));
        }

        const conflict = await Inventory.findOne({
          subCategoryId: item.subcategoryId,
          date: { $in: datesToCheck },
          status: 'booked'
        });

        if (conflict) {
          throw new Error(`Item "${item.subCategory}" is already booked for the selected dates.`);
        }

        const timeDiff = toDate.getTime() - fromDate.getTime();
        const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        bookingItems.push({
          subCategoryId: item.subcategoryId,
          serialNumber: item.serialNumber || '',
          fromDate: item.startDate,
          toDate: item.endDate,
          totalDays,
          price: item.price,
        });
      }

      // Create a single booking document with the array of items
      const newBooking = await Booking.create({
        customerId: customer._id,
        items: bookingItems,
        payment_method: payment_method.toLowerCase(),
        payment_status: payment_status.toLowerCase(),
        paidAt: payment_status.toLowerCase() === 'paid' ? formatDate(new Date()) : null,
        payment_history: paid_amount > 0 ? [{
          amount: paid_amount,
          payment_date: formatDate(new Date()),
          note: 'Initial payment'
        }] : [],
        received_by,
        bill_created_by,
        paid_amount,
        pending_amount,
        refered_by,
        total
      });

      // Create a corresponding payment record if an amount has been paid
        // await Payment.create({
        //   bookingId: newBooking._id,
        //   customerId: customer._id,
        //   // amount: paid_amount,
        //   total: total,
        //   paid_amount: paid_amount,
        //   pending_amount: pending_amount,
        //   paymentMethod: payment_method.toLowerCase(),
        //   paymentDate: formatDate(new Date()),
        //   status: 'completed',
        //   receivedBy: bill_created_by,
        // });
      
      // Block inventory for all booked items
      for (const item of newBooking.items) {
        const fromDate = parseDate(item.fromDate);
        const toDate = parseDate(item.toDate);
        const inventoryDates = [];
        const currentDate = new Date(fromDate);

        while (currentDate <= toDate) {
          inventoryDates.push({
            subCategoryId: item.subCategoryId,
            serialNumber: item.serialNumber || '',
            date: formatDate(currentDate),
            status: 'booked',
            customerId: customer._id,
            bookingId: newBooking._id,
            itemId: item._id,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (inventoryDates.length > 0) {
          await Inventory.insertMany(inventoryDates, { ordered: false }).catch(() => {});
        }
      }

      return Response.json({ success: true, message: MESSAGES.BOOKINGS_CREATED_SUCCESSFULLY, statusCode: STATUS_CODE.SUCCESS });
    } catch (error: any) {
      console.error('Booking Error:', error);
      return Response.json(
        { success: false, message: error.message || MESSAGES.INTERNAL_SERVER_ERROR, statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR },
        { status: STATUS_CODE.INTERNAL_SERVER_ERROR }
      );
    }
  }

  export async function GET(req: Request) {
    try {
      await connectMongoDB();
  
      const { searchParams } = new URL(req.url);
      const bookingId = searchParams.get('bookingId');
  
      // Handle GET by a single booking ID
      if (bookingId) {
        const booking = await Booking.findById(bookingId)
          .populate('customerId', 'fullName mobile')
          .populate({
            path: 'items.subCategoryId',
            model: 'SubCategory',
            populate: { path: 'categoryId', model: 'Category', select: 'name' },
          });
  
        if (!booking) {
          return Response.json({ success: false, message: MESSAGES.BOOKING_NOT_FOUND, statusCode: STATUS_CODE.NOT_FOUND });
        }
        return Response.json({ success: true, data: booking });
      }
  
      // Handle GET for all bookings (paginated list)
      const search = searchParams.get('search')?.trim();
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const skip = (page - 1) * limit;
  
      let customerIds = [];
      if (search) {
        const matchingCustomers = await Customer.find({ 
          fullName: { $regex: search, $options: 'i' } 
        }).select('_id');
        customerIds = matchingCustomers.map(c => c._id);
      }
  
      const bookingFilter: any = { deleted_at: null };
      if (search) {
        bookingFilter.customerId = { $in: customerIds };
      }
  
      const total = await Booking.countDocuments(bookingFilter);
      const allBookings = await Booking.find(bookingFilter)
        .populate('customerId', 'fullName mobile')
        .populate({
            path: 'items.subCategoryId',
            model: 'SubCategory',
            populate: { path: 'categoryId', model: 'Category', select: 'name' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
  
      const formattedData = allBookings.map(booking => ({
        _id: booking._id,
        customer: booking.customerId,
        bookings: booking.items.map((item: any) => ({
          _id: item._id,
          category: item.subCategoryId?.categoryId?.name || 'N/A',
        }))
      }));
  
      return Response.json({
        success: true,
        data: formattedData,
        page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
      });
  
    } catch (error: any) {
      console.error('GET /api/bookings error:', error);
      return Response.json({
        success: false,
        message: 'Database unavailable. Please check your MongoDB connection.',
        data: [],
        page: 1,
        totalPages: 0,
        totalRecords: 0,
      }, { status: 200 });
    }
  }
