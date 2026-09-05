/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useState } from "react";
import { useLoaderStore } from "@/store/useLoaderStore";
import Service from "@/lib/service";
import { API_ENDPOINTS } from "@/utils/constant";
import { showAppToast } from "@/utils/SnackbarUtils";

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    totalPages: 0,
    totalRecords: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const { showLoader, hideLoader } = useLoaderStore();

  // fetch all booking list
  const fetchBookings = useCallback(
    async ({ page = 1, limit = 10, searchText = "" }) => {
      showLoader();
      try {
        const url = `${
          API_ENDPOINTS.BOOKINGS
        }?page=${page}&limit=${limit}&search=${encodeURIComponent(searchText)}`;
        const response = await Service.get(url);
        setBookings(response?.data || []);
        setPagination({
          page: response?.page || 0,
          totalPages: response?.totalPages || 0,
          totalRecords: response?.totalRecords || 0,
        });
      } catch (err: any) {
        console.error("🚨 Error fetching bookings:", err?.message || err);
        setError(err.message || "Failed to fetch bookings");
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  // Format dates in the payload to ensure they're in DD-MM-YYYY format
  const formatBookingDates = (payload: any) => {
    if (!payload || !payload.bookings) return payload;
    
    const formattedBookings = payload.bookings.map((booking: any) => ({
      ...booking,
      // Ensure dates are in DD-MM-YYYY format
      startDate: formatDateForAPI(booking.startDate),
      endDate: formatDateForAPI(booking.endDate),
    }));
    
    return {
      ...payload,
      bookings: formattedBookings,
    };
  };

  // Format date to DD-MM-YYYY
  const formatDateForAPI = (date: any) => {
    if (!date) return '';
    
    // If it's already in DD-MM-YYYY format, return as is
    if (typeof date === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
      return date;
    }
    
    // If it's a Date object, format to DD-MM-YYYY
    if (date instanceof Date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    // If it's an ISO string, convert to Date first
    if (typeof date === 'string' && date.includes('T')) {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    return date;
  };

  // create booking list
  const createBooking = async (payload: any) => {
    showLoader();
    try {
      // Format dates in the payload
      const formattedPayload = formatBookingDates(payload);
      
      const response = await Service.post({
        url: API_ENDPOINTS.BOOKINGS,
        data: formattedPayload,
      });
      
      showAppToast("Booking created successfully!", "success");
      return response;
    } catch (err: any) {
      console.error('Error creating booking:', err);
      showAppToast(
        err.response?.data?.message || "Failed to create booking",
        "error"
      );
      throw new Error(
        err.response?.data?.message || "Failed to create booking"
      );
    } finally {
      hideLoader();
    }
  };

  // fetchBookinById
  const fetchBookingById = useCallback(
    async (bookingId: string) => {
      showLoader();
      try {
        const response = await Service.get(
          `${API_ENDPOINTS.BOOKINGS}?bookingId=${bookingId}`
        );
        return response.data;
      } catch (err: any) {
        console.error(`Error fetching booking with ID ${bookingId}:`, err);
        showAppToast(
          err.response?.data?.message || "Failed to fetch booking",
          "error"
        );
        throw new Error(
          err.response?.data?.message || "Failed to fetch booking"
        );
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  // update api
  const updateBooking = async (bookingId: string, payload: any) => {
    showLoader();
    try {
      // Format dates in the payload
      const formattedPayload = formatBookingDates(payload);
      // Calls PUT /api/bookings/[id]
      const response = await Service.update(
        `${API_ENDPOINTS.BOOKINGS}/${bookingId}`,
        formattedPayload
      );
      showAppToast("Booking updated successfully!", "success");
      return response;
    } catch (err: any) {
      console.error('Error updating booking:', err);
      showAppToast(
        err.response?.data?.message || "Failed to update booking",
        "error"
      );
      throw new Error(
        err.response?.data?.message || "Failed to update booking"
      );
    } finally {
      hideLoader();
    }
  };

  // delete booking
  const deleteBooking = async (bookingId: string[]) => {
    showLoader();
    try {
      // Calls DELETE /api/bookings/[id]
      const response = await Service.remove(
        `${API_ENDPOINTS.BOOKINGS}/${bookingId}`
      );
      showAppToast("Booking deleted successfully!", "success");
      return response;
    } catch (err: any) {
      showAppToast(
        err.response?.data?.message || "Failed to delete booking",
        "error"
      );
      throw new Error(
        err.response?.data?.message || "Failed to delete booking"
      );
    } finally {
      hideLoader();
    }
  };

  // fetch booking by customerID
  const fetchBookingsByCustomerId = useCallback(
    async (id: string) => {
      showLoader();
      try {
        const response = await Service.get(
          `${API_ENDPOINTS.BOOKINGS}/by-customer/${id}`
        );
        return response.data; // This should be an array of bookings
      } catch (err: any) {
        console.error(`Error fetching bookings for customer ${id}:`, err);
        throw new Error(
          err.response?.data?.message || "Failed to fetch customer bookings"
        );
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  return {
    bookings,
    pagination,
    error,
    createBooking,
    fetchBookings,
    fetchBookingById,
    updateBooking,
    deleteBooking,
    fetchBookingsByCustomerId,
  };
}
