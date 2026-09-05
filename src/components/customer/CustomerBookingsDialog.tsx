'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCustomerBookings } from '@/hooks/useCustomerBookings';
import { format } from 'date-fns';
import { useEffect } from 'react';

// interface Booking {
//   _id: string;
//   fromDate: string;
//   price: number;
//   payment_status: string;
//   received_by?: string;
//   given_by?: string;
//   subCategoryId: {
//     name: string;
//     serialNumber: string;
//     categoryId: {
//       name: string;
//     };
//   };
// }

interface CustomerBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
}

export function CustomerBookingsDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
}: CustomerBookingsDialogProps) {
  const { bookings, isLoading, error, fetchCustomerBookings } = useCustomerBookings();

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerBookings(customerId);
    }
  }, [open, customerId]);

  const formatDate = (dateString: string) => {
    try {
      const [day, month, year] = dateString.split('-').map(Number);
      return format(new Date(year, month - 1, day), 'PP');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Bookings for {customerName}</DialogTitle>
          </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-4 text-center">Loading bookings...</div>
        ) : error ? (
          <div className="py-4 text-red-600">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="py-4 text-gray-500">No bookings found for this customer.</div>
        ) : (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-700 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.subCategory?.serialNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.category.name} - {booking.subCategory.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.fromDate)} - {formatDate(booking.toDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ₹{booking.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : booking.payment_status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}