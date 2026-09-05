/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState, useCallback } from 'react';
import { useBookingSummary } from '@/hooks/useBookingSummary';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import Pagination from '@/components/common/Pagination';
import { useCategories } from '@/hooks/useCategories';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function BookingSummary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [selectedBookingItem, setSelectedBookingItem] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<'given' | 'received'>('received');
  const [receivedBy, setReceivedBy] = useState('');
  const [givenBy, setGivenBy] = useState('');
  const [showModal, setShowModal] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { categories } = useCategories();

  const formatDateForAPI = (date: Date | null): string => {
    if (!date) return '';
    return format(date, 'dd-MM-yyyy');
  };

  const formatDisplayDate = (value?: string) => {
    if (!value) return '-';
    const date = value.includes('-') && /^\d{2}-\d{2}-\d{4}$/.test(value)
      ? new Date(value.split('-').reverse().join('-'))
      : new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
  };

  const {
    bookings = [],
    isLoading = false,
    error = null,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 1 },
    updateGivenBy = async () => {},
    updateReceivedBy = async () => {},
    cancelBooking = async () => {},
  } = useBookingSummary({
    page,
    search: debouncedSearchTerm,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    startDate: startDate ? formatDateForAPI(startDate) : undefined,
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  }, []);

  const openStatusModal = (item: any, action: 'given' | 'received') => {
    setSelectedBookingItem(item);
    setSelectedAction(action);
    setGivenBy(item.given_by || '');
    setReceivedBy(item.received_by || '');
    setShowModal(true);
  };

  const handleUpdateItemStatus = async () => {
    if (!selectedBookingItem) return;
    if (selectedAction === 'given' && !givenBy.trim()) return;
    if (selectedAction === 'received' && !receivedBy.trim()) return;

    try {
      if (selectedAction === 'given') {
        await updateGivenBy(selectedBookingItem._id, givenBy, selectedBookingItem.itemId);
      } else {
        await updateReceivedBy(selectedBookingItem._id, givenBy, receivedBy, selectedBookingItem.itemId);
      }
      setShowModal(false);
      setReceivedBy('');
      setGivenBy('');
    } catch (err) {
      console.error('Error updating item status:', err);
    }
  };

  const handleCancelBooking = async (bookingId: string, itemId?: string) => {
    if (!window.confirm('Are you sure you want to cancel this item?')) return;

    try {
      await cancelBooking(bookingId, itemId);
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDateChange = (date: Date | null) => {
    setStartDate(date);
    setPage(1);
  };

  if (isLoading && !bookings.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="text-black">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Booking Summary</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden mb-2">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by customer name"
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            />

            <div className="w-full">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full flex gap-2">
              <div className="flex-1">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    format="dd/MM/yyyy"
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        className: 'bg-white',
                      },
                    }}
                    className="border border-gray-300"
                  />
                </LocalizationProvider>
              </div>
              <button
                onClick={() => {
                  setStartDate(null);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title="Clear date filter"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Booked Items</h2>
            <span className="text-sm text-gray-500">{pagination.total} total items</span>
          </div>

          <div className="overflow-x-auto">
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No bookings found matching your criteria</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-700 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Customer</th>
                    <th className="py-3 px-4 text-left">Booking Date</th>
                    <th className="py-3 px-4 text-left">Item No</th>
                    <th className="py-3 px-4 text-left">Item Details</th>
                    <th className="py-3 px-4 text-left">Booked Dates</th>
                    <th className="py-3 px-4 text-left">Amount</th>
                    <th className="py-3 px-4 text-left">Item Status</th>
                    <th className="py-3 px-4 text-left">Payment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((item) => {
                    const isCancelled = item.status === 'cancelled';
                    const isReceived = item.status === 'received';
                    const isGiven = item.status === 'given';
                    const paymentLabel = item.payment_status.charAt(0).toUpperCase() + item.payment_status.slice(1);

                    return (
                      <tr key={`${item._id}-${item.itemId || ''}`} className={isCancelled ? 'bg-gray-50 text-gray-500' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`font-medium ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.customerId?.fullName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDisplayDate(item.bookingDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{item.subCategoryId?.serialNumber || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{item.subCategoryId?.categoryId?.name || '-'}</div>
                          <div className="text-sm text-gray-500">{item.subCategoryId?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{formatDisplayDate(item.fromDate)}</div>
                          <div className="text-xs text-gray-400">to {formatDisplayDate(item.toDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {item.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isCancelled
                              ? 'bg-gray-200 text-gray-700 border border-gray-300'
                              : isReceived
                                ? 'bg-green-100 text-green-800'
                                : isGiven
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isCancelled ? 'Cancelled' : isReceived ? 'Received' : isGiven ? 'Given' : 'Active'}
                          </span>
                          {(item.given_by || item.received_by) && (
                            <div className="mt-1 text-xs text-gray-500">
                              {item.given_by && <div>Given: {item.given_by}</div>}
                              {item.received_by && <div>Received: {item.received_by}</div>}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : item.payment_status === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {paymentLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isCancelled || isReceived ? (
                            <span className="inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md bg-gray-200 text-gray-600">
                              {isCancelled ? 'Cancelled' : 'Received'}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2 justify-end">
                              {!isGiven && (
                                <button
                                  type="button"
                                  onClick={() => openStatusModal(item, 'given')}
                                  className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                  Given
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openStatusModal(item, 'received')}
                                className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-[#F0A611] hover:bg-[#F0A611]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                              >
                                Received
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(item._id, item.itemId)}
                                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedAction === 'given' ? 'Mark Item as Given' : 'Mark Item as Received'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>

            <div className="mb-4">
              <p><strong>Customer:</strong> {selectedBookingItem?.customerId?.fullName}</p>
              <p><strong>Item:</strong> {selectedBookingItem?.subCategoryId?.categoryId?.name} - {selectedBookingItem?.subCategoryId?.name}</p>
            </div>

            <div className="mb-6">
              <label htmlFor="givenBy" className="block text-sm font-medium text-gray-500 mb-1">Given By</label>
              <input
                type="text"
                id="givenBy"
                value={givenBy}
                onChange={(e) => setGivenBy(e.target.value)}
                placeholder="Enter giver's name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {selectedAction === 'received' && (
              <div className="mb-6">
                <label htmlFor="receivedBy" className="block text-sm font-medium text-gray-500 mb-1">Received By</label>
                <input
                  type="text"
                  id="receivedBy"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Enter receiver's name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button
                type="button"
                onClick={handleUpdateItemStatus}
                disabled={selectedAction === 'given' ? !givenBy.trim() : !receivedBy.trim()}
                className="px-4 py-2 border rounded-md text-white bg-[#F0A611] disabled:bg-gray-300"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
