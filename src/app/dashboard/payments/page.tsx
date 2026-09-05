'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { usePayments, Payment } from '@/hooks/usePayments';
import { formatDate } from '@/components/common/dateFormatter';
import Pagination from '@/components/common/Pagination';
import { useDebounce } from '@/hooks/useDebounce';

export default function PaymentsPage() {
  const { payments, pagination, loading, error, updatePayment, refresh } = usePayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [pendingOnly, setPendingOnly] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    refresh({ page: currentPage, search: debouncedSearchTerm, pendingOnly });
  }, [currentPage, debouncedSearchTerm, pendingOnly, refresh]);

  const formatDateForAPI = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    const updatePayload = {
      paid_amount: paidAmount,
      payment_date: paymentDate ? formatDateForAPI(paymentDate) : undefined,
    };

    try {
      await updatePayment(selectedPayment._id, updatePayload);
      setSelectedPayment(null);
      await refresh({ page: currentPage, search: debouncedSearchTerm, pendingOnly });
    } catch (updateError) {
      console.error('Failed to update payment', updateError);
    }
  };

  if (loading && !payments.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <div className="text-xl font-semibold text-gray-800">
                {loading ? <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div> : pagination?.total}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <div className="text-xl font-semibold text-gray-800">
                {loading ? <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div> : `Rs. ${pagination?.aggregates?.totalAmount?.toLocaleString() || '0'}`}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Paid Amount</p>
              <div className="text-xl font-semibold text-green-600">
                {loading ? <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div> : `Rs. ${pagination?.aggregates?.totalPaid?.toLocaleString() || '0'}`}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Amount</p>
              <div className="text-xl font-semibold text-red-600">
                {loading ? <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div> : `Rs. ${pagination?.aggregates?.totalPending?.toLocaleString() || '0'}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by customer name..."
            className="pl-10 w-full border rounded-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => {
              setPendingOnly(e.target.checked);
              setCurrentPage(1);
            }}
            className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-600"
          />
          Pending payment customers only
        </label>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead className="bg-red-700 text-white">
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold tracking-wider">Customer</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold tracking-wider">Category</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold tracking-wider">Total Amount</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold tracking-wider">Paid Amount</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold tracking-wider">Pending Amount</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold tracking-wider">Last Payment Date</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{payment.customerId.fullName}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{payment.items.length > 0 ? 'Multiple' : 'N/A'}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">Rs. {payment.total.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-green-600 font-semibold whitespace-no-wrap">Rs. {payment.paid_amount.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-red-600 font-semibold whitespace-no-wrap">Rs. {payment.pending_amount.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{formatDate(payment.updatedAt)}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setPaidAmount(payment.paid_amount);
                            setPaymentDate(new Date().toISOString().slice(0, 10));
                          }}
                          className="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center me-2 mb-2 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">No payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5 py-5 bg-white border-t flex flex-col xs:flex-row items-center xs:justify-between">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-black">Update Payment</h2>
            <div className="mb-4 text-black">
              <p><strong>Customer:</strong> {selectedPayment.customerId.fullName}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Total Amount</label>
                <input
                  className="w-full py-2 px-3 border rounded bg-gray-200 text-gray-700 cursor-not-allowed"
                  type="text"
                  value={selectedPayment.total}
                  disabled
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Paid Amount</label>
                <input
                  className="w-full py-2 px-3 border rounded text-gray-700"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Payment Date</label>
                <input
                  className="w-full py-2 px-3 border rounded text-gray-700"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Pending Amount</label>
                <input
                  className="w-full py-2 px-3 border rounded bg-gray-200 text-gray-700 cursor-not-allowed"
                  type="text"
                  value={selectedPayment.total - paidAmount}
                  disabled
                />
              </div>
              {selectedPayment.payment_history && selectedPayment.payment_history.length > 0 && (
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Payment History</label>
                  <div className="max-h-32 overflow-y-auto rounded border border-gray-200 text-sm">
                    {selectedPayment.payment_history.map((entry, index) => (
                      <div key={`${entry.payment_date}-${index}`} className="flex justify-between px-3 py-2 border-b last:border-b-0">
                        <span>{formatDate(entry.payment_date)}</span>
                        <span className="font-medium text-green-700">Rs. {entry.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                type="button"
                onClick={() => setSelectedPayment(null)}
              >
                Cancel
              </button>
              <button
                className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg"
                type="button"
                onClick={handleUpdatePayment}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
