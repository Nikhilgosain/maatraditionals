/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import { useLoaderStore } from '@/store/useLoaderStore';
import Service from '@/lib/service';
import { showAppToast } from '@/utils/SnackbarUtils';

export interface BookingSummary {
  _id: string;
  itemId?: string;
  customerId: {
    _id: string;
    fullName: string;
  };
  subCategoryId: {
    _id: string;
    name: string;
    serialNumber: number;
    categoryId: {
      _id: string;
      name: string;
    };
  };
  bookingDate?: string;
  fromDate: string;
  toDate: string;
  price: number;
  payment_status: string;
  status?: 'active' | 'given' | 'received' | 'cancelled';
  received_by: string;
  given_by: string;
  given_at?: string;
  received_at?: string;
  cancelled_at?: string;
  returned_at?: string;
}

interface UseBookingSummaryProps {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  startDate?: string | Date | null;
}

export function useBookingSummary({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  category = '',
  startDate = '',
}: UseBookingSummaryProps = {}) {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page,
    limit,
    totalPages: 1
  });
  const { showLoader, hideLoader, isLoading } = useLoaderStore();


  const fetchBookings = useCallback(async () => {
    showLoader();
    setError(null);
    setBookings([]); // Clear previous results immediately

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }
    if (status && status.trim() !== '') {
      params.append('status', status.trim());
    }
    if (category && category !== 'all') {
      params.append('category', category);
    }
    if (startDate) {
      try {
        const dateToFormat = startDate;
        let formattedDate = '';
        if (typeof dateToFormat === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateToFormat)) {
          formattedDate = dateToFormat;
        } else if (dateToFormat instanceof Date && !isNaN(dateToFormat.getTime())) {
          const day = String(dateToFormat.getDate()).padStart(2, '0');
          const month = String(dateToFormat.getMonth() + 1).padStart(2, '0');
          const year = dateToFormat.getFullYear();
          formattedDate = `${day}-${month}-${year}`;
        } else if (typeof dateToFormat === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateToFormat)) {
          const [year, month, day] = dateToFormat.split('-');
          formattedDate = `${day}-${month}-${year}`;
        }

        if (formattedDate) {
          params.append('startDate', formattedDate);
        }
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }

    try {
      const response = await Service.get(`/bookings/summary?${params}`);
      if (response && response.data) {
        setBookings(response.data || []);
        setPagination({
          total: response.pagination?.total || 0,
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 10,
          totalPages: response.pagination?.totalPages || 1
        });
      } else {
        setError(response.data?.message || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings. Please try again.');
    } finally {
      hideLoader();
    }
  }, [page, limit, search, status, category, startDate, showLoader, hideLoader]);


  const updateReceivedBy = async (bookingId: string, givenBy: string, receivedBy: string, itemId?: string) => {
    try {
      showLoader();

      const payload = JSON.stringify({ received_by: receivedBy, given_by: givenBy, status: 'received', itemId });
      const response = await Service.update(
        `/bookings/${bookingId}/received`,
        payload 
      );

      if (response) {
        showAppToast(response.message || "Received by updated successfully and items marked as available")
      }

      await fetchBookings();
      return true;
    } catch (err) {
      console.error('Error updating received by:', err);
      throw err;
    } finally {
      hideLoader();
    }
  };

  const updateGivenBy = async (bookingId: string, givenBy: string, itemId?: string) => {
    try {
      showLoader();

      const payload = JSON.stringify({ given_by: givenBy, status: 'given', itemId });
      const response = await Service.update(
        `/bookings/${bookingId}/received`,
        payload
      );

      if (response) {
        showAppToast(response.message || 'Item marked as given successfully');
      }

      await fetchBookings();
      return true;
    } catch (err) {
      console.error('Error updating given by:', err);
      throw err;
    } finally {
      hideLoader();
    }
  };

  const cancelBooking = async (bookingId: string, itemId?: string) => {
    try {
      showLoader();

      const payload = JSON.stringify({ status: 'cancelled', itemId });
      const response = await Service.update(
        `/bookings/${bookingId}/received`,
        payload
      );

      if (response) {
        showAppToast(response.message || 'Booking cancelled successfully');
      }

      await fetchBookings();
      return true;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      throw err;
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    error,
    pagination,
    updateGivenBy,
    updateReceivedBy,
    cancelBooking,
    refresh: fetchBookings,
    isLoading
  };
}
