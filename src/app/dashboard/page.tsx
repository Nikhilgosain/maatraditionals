/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useBookings } from "@/hooks/useBookings";
import Pagination from "@/components/common/Pagination";
import { useRouter } from "next/navigation";
import { showAppToast } from "@/utils/SnackbarUtils";
import { useDebounce } from "@/hooks/useDebounce";

export default function Dashboard() {
  const { fetchBookings, pagination, bookings, deleteBooking } = useBookings();
  const [searchText, setSearchText] = useState("");
  const debouncedText = useDebounce(searchText, 500);

  const loadBookings = useCallback((page = 1, limit = 10, search = "") => {
    fetchBookings({ page, limit, searchText: search });
  }, [fetchBookings]);

  useEffect(() => {
    loadBookings(1, 10, debouncedText);
  }, [debouncedText, loadBookings]);

  const router = useRouter();

  const handleDelete = async (bookingIds: string[]) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await deleteBooking(bookingIds);
        loadBookings(1, 10, debouncedText);
      } catch (error: any) {
        showAppToast(error.message, "error");
      }
    }
  };

  return (
    <>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold  text-black">Booking List</h2>

        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name"
          className="border border-black-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
        />
      </div>

      <div className="bg-white rounded-xl overflow-x-auto shadow-md">
        <table className="w-full text-left text-gray-800">
          <thead className="bg-red-700 text-white">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Phone Number</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((entry: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-3 px-4">
                    {entry.customer?.fullName || "-"}
                  </td>
                  <td className="py-3 px-4">
                    {entry.bookings[0]?.category || "-"}
                  </td>
                  <td className="py-3 px-4">{entry.customer?.mobile || "-"}</td>
                  <td className="py-3 px-4 flex items-center space-x-4">
                    <button
                      type="button"
                      className="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/dashboard/booking?customerId=${entry.customer._id}`
                        )
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2 text-center me-2 mb-2 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900 cursor-pointer"
                      onClick={() =>
                        handleDelete([entry._id])
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {bookings.length > 0 && (
          <div className="mb-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) =>
              loadBookings(page, 10, searchText)
            }
          />
          </div>
        )}
      </div>
    </>
  );
}