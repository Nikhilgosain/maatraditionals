import Service from '@/lib/service';
import { useState } from 'react';

interface Booking {
  _id: string;
  fromDate: string;
  toDate: string;
  price: number;
  payment_status: string;
  received_by?: string;
  given_by?: string;
  subCategory: {
    name: string;
    serialNumber: string;
  };
  category: {
    name: string
  }
}

export function useCustomerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerBookings = async (customerId: string) => {
    if (!customerId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await Service.get(`/customers/${customerId}/bookings`);
      setBookings(response.data.bookings || []);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { bookings, isLoading, error, fetchCustomerBookings };
}