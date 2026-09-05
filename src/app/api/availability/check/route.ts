/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMongoDB } from "@/lib/db/mongo";
import Inventory from "@/models/inventory";
import { STATUS_CODE } from "@/utils/constant";
import { NextRequest } from "next/server";

// Import models to ensure they're registered
import '@/models/inventory';
import '@/models/subcategories';

// Helper function to parse date string (DD-MM-YYYY) to Date object
const parseDate = (dateStr: string): Date | null => {
  try {
    const [day, month, year] = dateStr.split('-').map(Number);
    // Create date in local time zone
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
};

// Helper function to format Date object to DD-MM-YYYY string
const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export async function POST(req: NextRequest) {
    try {
      await connectMongoDB();
      const { subCategoryId, startDate, endDate } = await req.json();
  
      if (!subCategoryId || !startDate || !endDate) {
        return Response.json(
          { error: "Missing required fields" },
          { status: STATUS_CODE.ERROR }
        );
      }
  
      const allItems = await Inventory.find({
        subCategoryId,
        status: 'booked',
        date: { $gte: startDate, $lte: endDate }
      });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const bookedItems = allItems.filter(item => {
        if (!item.deleted_at) {
          return true;
        }
        
        const [day, month, year] = item.deleted_at.split('-').map(Number);
        const deletedDate = new Date(year, month - 1, day);
        return deletedDate >= today;
      });
      
      // Create a Set of all unique booked dates
      const bookedDates = new Set(bookedItems.map(item => item.date));
      
      // Convert the Set directly to an array of conflicts
      const conflicts = Array.from(bookedDates).map(date => ({
        date,
        formattedDate: date
      }));
  
      if (conflicts.length > 0) {
        return Response.json({
          available: false,
          conflicts: conflicts.sort((a, b) => 
            parseDate(a.date)!.getTime() - parseDate(b.date)!.getTime()
          )
        });
      }
  
      return Response.json({ 
        available: true,
        conflicts: []
      }, { status: STATUS_CODE.SUCCESS });
    } catch (err: any) {
      console.error('Error in availability check:', err);
      return Response.json(
        { error: err.message || 'Internal server error' }, 
        { status: STATUS_CODE.INTERNAL_SERVER_ERROR }
      );
    }
  }

  
// export async function POST(req: NextRequest) {
//   try {
//     await connectMongoDB();
//     const { subCategoryId, startDate, endDate } = await req.json();

//     if (!subCategoryId || !startDate || !endDate) {
//       return Response.json(
//         { error: "Missing required fields" },
//         { status: STATUS_CODE.ERROR }
//       );
//     }

//     // Get all booked inventory items for this subcategory and date range
//     const allItems = await Inventory.find({
//       subCategoryId,
//       status: 'booked',
//       date: { $gte: startDate, $lte: endDate }
//     });
    
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Normalize to start of day
    
//     const bookedItems = allItems.filter(item => {
//       // If the item doesn't have a deleted_at, it's not deleted
//       if (!item.deleted_at) {
//         return true;
//       }
      
//       const [day, month, year] = item.deleted_at.split('-').map(Number);
//       const deletedDate = new Date(year, month - 1, day);
      
//       // Include the item if the deletion date is today or in the future
//       return deletedDate >= today;
//     });
    
//     // Create a Set of all unique booked date strings for efficient lookups
//     const bookedDateStrings = new Set(bookedItems.map(item => item.date));
//     const conflicts: { date: string; formattedDate: string }[] = [];

//     // A date is a conflict only if it's the start of a booking.
//     // A start date is a booked day where the previous day was NOT booked.
//     bookedDateStrings.forEach(dateStr => {
//         const currentDate = parseDate(dateStr);
//         if (!currentDate) return;

//         const prevDay = new Date(currentDate);
//         prevDay.setDate(currentDate.getDate() - 1);
//         const prevDayStr = formatDate(prevDay);

//         const isPrevDayBooked = bookedDateStrings.has(prevDayStr);
        
//         // If the previous day was not booked, this is a start date (or a single day booking)
//         // and should be marked as a conflict.
//         if (!isPrevDayBooked) {
//             conflicts.push({ date: dateStr, formattedDate: dateStr });
//         }
//     });

//     if (conflicts.length > 0) {
//       return Response.json({
//         available: false,
//         conflicts: conflicts.sort((a, b) => 
//           parseDate(a.date)!.getTime() - parseDate(b.date)!.getTime()
//         )
//       });
//     }

//     return Response.json({ 
//       available: true,
//       conflicts: []
//     }, { status: STATUS_CODE.SUCCESS });
//   } catch (err: any) {
//     console.error('Error in availability check:', err);
//     return Response.json(
//       { error: err.message || 'Internal server error' }, 
//       { status: STATUS_CODE.INTERNAL_SERVER_ERROR }
//     );
//   }
// }