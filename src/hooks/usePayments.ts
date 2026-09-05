/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from 'react';
import { useLoaderStore } from '@/store/useLoaderStore';
import Service from '@/lib/service';
import { showAppToast } from '@/utils/SnackbarUtils';

export interface Payment {
  _id: string;
  customerId: {
    _id: string;
    fullName: string;
  };
  total: number;
  paid_amount: number;
  pending_amount: number;
  updatedAt: string;
  payment_history?: { amount: number; payment_date: string; note?: string }[];
  items: any[];
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showLoader, hideLoader } = useLoaderStore();

  const fetchPayments = useCallback(async ({ page = 1, search = '', pendingOnly = false }) => {
    setLoading(true);
    showLoader();
    try {
      const response = await Service.get(`/payments?page=${page}&search=${search}&pendingOnly=${pendingOnly ? 'true' : 'false'}`);
      setPayments(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  const deletePayment = async (id: string) => {
    showLoader();
    try {
      await Service.remove(`/payments?id=${id}`);
      showAppToast('Payment record deleted successfully', 'success');
    } catch (err: any) {
      showAppToast(err.message || 'Failed to delete payment', 'error');
      throw err;
    } finally {
      hideLoader();
    }
  };

  const updatePayment = async (id: string, payload: any) => {
    showLoader();
    try {
      await Service.update(`/payments?id=${id}`, payload);
      showAppToast('Payment updated successfully', 'success');
    } catch (err: any) {
      showAppToast(err.message || 'Failed to update payment', 'error');
      throw err;
    } finally {
      hideLoader();
    }
  };

  return { payments, pagination, loading, error, deletePayment, updatePayment, refresh: fetchPayments };
}
