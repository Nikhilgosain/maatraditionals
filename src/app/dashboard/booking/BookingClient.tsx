/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import { useEffect, useState } from "react";
import CustomDatePicker from "@/components/common/CustomDatePicker";
import { useCategories } from "@/hooks/useCategories";
import { useSubCategories } from "@/hooks/useSubCategories";
import { useBookings } from "@/hooks/useBookings";
import { useSearchParams } from "next/navigation";
import {
  formatDateForAPI,
  formatDateToLocalYYYYMMDD,
} from "@/components/common/dateFormatter";
import { useAvailability } from "@/hooks/useAvailability";
import { showAppToast } from "@/utils/SnackbarUtils";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/utils/constant";
import { useInvoice } from "@/hooks/useInvoice";
import { useLoaderStore } from "@/store/useLoaderStore";
import { uploadFile } from "@/utils/fileUpload";
import Image from 'next/image';
import Select from 'react-select';
import { getCurrentUser } from '@/utils/auth';

export default function BookingClient() {
  // Get bookingId from URL
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const isEditMode = !!customerId;
  const router = useRouter();

  // State for customer info, payment, and total
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<{
    fullName: string;
    mobile: string;
    address: string;
    proof: File | null;
    total: number;
    payment_method: string;
    payment_status: string;
    bill_created_by: string;
    // received_by?: string;
    paid_amount: number;
    pending_amount: number;
    refered_by: string;
  }>({
    fullName: "",
    mobile: "",
    address: "",
    proof: null,
    total: 0,
    payment_method: "",
    payment_status: "",
    bill_created_by: "",
    // received_by: "",
    paid_amount: 0,
    pending_amount: 0,
    refered_by: ''
  });

  // State for the inputs of the booking item being added
  const [currentItemData, setCurrentItemData] = useState({
    subcategoryId: "",
    startDate: "",
    endDate: "",
    price: "",
  });

  const { createBooking, updateBooking, fetchBookingsByCustomerId } =
    useBookings();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Parse date string (YYYY-MM-DD) to Date object
  const parseDateFromString = (dateStr: string): Date | null => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    // The month argument in the Date constructor is 0-indexed (0 for January).
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  // Update local date states when currentItemData changes
  useEffect(() => {
    if (currentItemData.startDate) {
      const parsedDate = parseDateFromString(currentItemData.startDate);
      if (parsedDate && (!startDate || parsedDate.getTime() !== startDate.getTime())) {
        setStartDate(parsedDate);
      }
    }

    if (currentItemData.endDate) {
      const parsedDate = parseDateFromString(currentItemData.endDate);
      if (parsedDate && (!endDate || parsedDate.getTime() !== endDate.getTime())) {
        setEndDate(parsedDate);
      }
    }
  }, [currentItemData.startDate, currentItemData.endDate]);
  const { categories, isLoading: isCategoriesLoading } = useCategories();

  // State for the single selected category for the entire booking
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  // Fetch all subcategories for the dropdown without pagination
  const { subCategories } = useSubCategories({
    categoryId: selectedCategory,
    fetchAll: true, // This will fetch all subcategories
    enablePagination: false // Disable pagination for the dropdown
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [deletedBookingIds, setDeletedBookingIds] = useState<string[]>([]);
  const { checkAvailability } = useAvailability();
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isTotalManuallyEdited, setIsTotalManuallyEdited] = useState(false);
  const { generateInvoice } = useInvoice();
  const isgeneratingInvoice = useLoaderStore((s) => s.isLoading);
  const { showLoader, hideLoader } = useLoaderStore();
  const currentUser = getCurrentUser();
  const canBookBackDate = Boolean(currentUser?.isSuperAdmin || currentUser?.isAdmin);

  // Function to handle the API call and download
  const handleDownloadInvoice = async () => {
    const payload = {
      logoSrc: "/logo.png",
      orgName: "Maa Traditional Dresses",
      invoiceTitle: "Invoice",
      invoiceNo: isEditMode ? customerId || undefined : undefined,
      invoiceDate: new Date().toLocaleDateString("en-GB"),
      bill_created_by: formData.bill_created_by,
      refered_by: formData.refered_by,
      // received_by: formData.received_by,
      customer: {
        fullName: formData.fullName,
        mobile: formData.mobile,
        address: formData.address,
      },
      bookings: [...bookings]
        .sort((a, b) => {
          // Parse dates in DD-MM-YYYY format
          const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day).getTime();
          };
          return parseDate(a.startDate) - parseDate(b.startDate);
        })
        .map((b: any) => ({
          categoryName: b.categoryName,
          subcategoryName: b.subcategoryName,
          serialNumber: b.serialNumber || '',
          price: Number(b.price || 0),
          startDate: b.startDate,
          endDate: b.endDate,
        })),
      billing: {
        subtotal: bookings.reduce(
          (acc, cur) => acc + Number(cur.price || 0),
          0
        ),
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        paid_amount: formData.paid_amount,
        pending_amount: Math.max(0, formData.total - formData.paid_amount),
        total: Number(formData.total || 0),
      },
    };
    try {
      await generateInvoice(payload);
    } catch (error: any) {
      console.error("Error generating invoice:", error);
    }
  };

  const validateBookingItem = () => {
    const newErrors: { [key: string]: string } = {};
    if (!selectedCategory) newErrors.categoryId = "Category is required.";
    if (!currentItemData.subcategoryId)
      newErrors.subcategoryId = "Subcategory is required.";
    if (!currentItemData.startDate)
      newErrors.startDate = "Start date is required.";
    if (!currentItemData.endDate) newErrors.endDate = "End date is required.";
    if (!currentItemData.price.trim()) newErrors.price = "Price is required.";
    return newErrors;
  };

  const handleAddBooking = () => {
    const itemErrors = validateBookingItem();
    if (Object.keys(itemErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...itemErrors }));
      return;
    }
    setErrors((prev => {
      const newErrors = { ...prev };
      delete newErrors.categoryId;
      delete newErrors.subcategoryId;
      delete newErrors.startDate;
      delete newErrors.endDate;
      delete newErrors.price;
      return newErrors;
    }));

    const selectedCategoryObj = categories.find(
      (cat) => cat._id === selectedCategory
    );
    const selectedSubCategoryObj = subCategories.find(
      (sub) => sub._id === currentItemData.subcategoryId
    );

    const newBooking = {
      _id: Date.now().toString(),
      categoryId: selectedCategory,
      categoryName: selectedCategoryObj?.name || "",
      subcategoryId: currentItemData.subcategoryId,
      subcategoryName: selectedSubCategoryObj?.name || "",
      serialNumber: selectedSubCategoryObj?.serialNumber || "",
      startDate: formatBookingDate(currentItemData.startDate),
      endDate: formatBookingDate(currentItemData.endDate),
      price: parseFloat(currentItemData.price) || 0,
    };

    setBookings(prev => {
      const updatedBookings = [...prev, newBooking];
      // Auto-calculate total when adding a new booking
      if (!isTotalManuallyEdited) {
        const calculatedTotal = updatedBookings.reduce((acc, cur) => acc + Number(cur.price || 0), 0);
        setFormData(prevForm => ({
          ...prevForm,
          total: calculatedTotal,
          pending_amount: Math.max(0, calculatedTotal - (prevForm.paid_amount || 0))
        }));
      }
      return updatedBookings;
    });

    // Reset form fields
    setCurrentItemData({
      subcategoryId: "",
      startDate: "",
      endDate: "",
      price: "",
    });
    setStartDate(null);
    setEndDate(null);
  };

  // Format dates to DD-MM-YYYY for storage
  const formatBookingDate = (dateInput: string | Date): string => {
    try {
      // Handle null/undefined input
      if (!dateInput) return '';

      // If input is already in DD-MM-YYYY format, validate and return
      if (typeof dateInput === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateInput)) {
        const parsedDate = parseDDMMYYYY(dateInput);
        if (!parsedDate) throw new Error('Invalid date');
        return dateInput;
      }

      let date: Date;

      // If input is a Date object
      if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) throw new Error('Invalid Date object');
        date = dateInput;
      }
      // If input is in YYYY-MM-DD format
      else if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        date = new Date(dateInput);
        if (isNaN(date.getTime())) throw new Error('Invalid date string');
      }
      // If input is in some other format, try to parse it as a date
      else {
        date = new Date(dateInput);
        if (isNaN(date.getTime())) throw new Error('Invalid date format');
      }

      // Format the date as DD-MM-YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Fetch data in edit mode
  useEffect(() => {
    if (isEditMode && customerId) {
      const loadBookingData = async () => {
        try {
          const response = await fetchBookingsByCustomerId(customerId);

          if (response) {
            const { customer, bookings, ...bookingData } = response;

            if (bookings?.length > 0) {
              setSelectedCategory(bookings[0].categoryId || "");

              const enrichedBookings = bookings.map((b: any) => ({
                _id: b._id,
                categoryId: b.categoryId,
                categoryName: b.category,
                subcategoryId: b.subcategoryId,
                subcategoryName: b.subCategory,
                serialNumber: b.serialNumber || '',
                startDate: b.startDate,
                endDate: b.endDate,
                price: b.price,
                status: b.status || 'active',
                given_by: b.given_by || '',
                received_by: b.received_by || '',
              }));
              setBookings(enrichedBookings);

              // Check if the total was manually set
              const calculatedTotal = enrichedBookings.reduce((acc: number, cur: { price: any; }) => acc + Number(cur.price || 0), 0);
              if (bookingData.total !== calculatedTotal) {
                setIsTotalManuallyEdited(true);
              }
            }

            setFormData(prev => ({
              ...prev,
              customerId: customer._id,
              fullName: customer.fullName,
              mobile: customer.mobile,
              address: customer.address || '',
              proof: customer.proof || '',
              refered_by: bookingData.refered_by || '',
              bill_created_by: bookingData.bill_created_by || '',
              received_by: bookingData.received_by || '',
              payment_method: bookingData.payment_method || '',
              payment_status: bookingData.payment_status || '',
              paid_amount: bookingData.paid_amount || 0,
              total: bookingData.total || 0,
              pending_amount: bookingData.pending_amount || 0,
            }));

            if (customer.proof) {
              setFilePreview(customer.proof);
            }
          }
        } catch (error) {
          console.error("Error loading bookings:", error);
        }
      };
      loadBookingData();
    } else {
      setFormData({
        fullName: "",
        mobile: "",
        address: "",
        proof: null,
        total: 0,
        payment_method: "",
        payment_status: "",
        bill_created_by: "",
        paid_amount: 0,
        pending_amount: 0,
        refered_by: ''
      });
      setBookings([]);
      setSelectedCategory("");
      setFilePreview(null);
      setDeletedBookingIds([]);
      setIsTotalManuallyEdited(false);
    }
  }, [isEditMode, customerId, fetchBookingsByCustomerId]);

  // Handle manual total updates
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotal = parseFloat(e.target.value) || 0;
    setFormData(prev => {
      const newPending = Math.max(0, newTotal - (prev.paid_amount || 0));
      return {
        ...prev,
        total: newTotal,
        pending_amount: newPending
      };
    });
    setIsTotalManuallyEdited(true);
  };

  // Auto-calculate total when bookings change
  useEffect(() => {
    if (!isTotalManuallyEdited) {
      const calculatedTotal = bookings.reduce((acc, cur) => acc + Number(cur.price || 0), 0);
      setFormData(prev => ({
        ...prev,
        total: calculatedTotal,
        pending_amount: Math.max(0, calculatedTotal - (prev.paid_amount || 0))
      }));
    }
  }, [bookings, isTotalManuallyEdited, formData.paid_amount]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.payment_method) newErrors.payment_method = "Payment method is required.";
    if (!formData.payment_status) newErrors.payment_status = "Payment status is required.";
    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits.";
    }
    // if (formData.paid_amount > formData.total) {
    //   newErrors.paid_amount = "Paid amount cannot exceed total amount.";
    // }
    if (!formData.bill_created_by.trim()) {
      newErrors.bill_created_by = "Bill created by is required.";
    }
    // if (!formData.paid_amount) {
    //   newErrors.paid_amount = "Paid amount is required.";
    // }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showAppToast("Please fix the errors in the form.", "error");
      return;
    }
    setErrors({});
    if (bookings.length === 0) {
      showAppToast("Please add at least one booking item.", "error");
      return;
    }

    try {
      showLoader();
      let proofUrl = '';

      // Only upload if proof is a File object (new upload)
      if (formData.proof && formData.proof instanceof File) {
        setIsUploading(true);
        // Ensure we have a valid user ID
        if (!formData.mobile) {
          throw new Error('Mobile number is required for document upload');
        }

        try {
          const uploadResponse = await uploadFile(
            formData.proof,
            'document',
            {
              documentType: 'id_proof',
              userId: formData.mobile,
              description: `ID proof for ${formData.fullName} (${formData.mobile})`,
              bookingReference: customerId || `new-booking-${Date.now()}`,
              customerName: formData.fullName,
              customerMobile: formData.mobile
            }
          );
          proofUrl = uploadResponse.data.fileUrl;
        } catch (error) {
          console.error('File upload failed:', error);
          throw new Error('Failed to upload document. Please try again.');
        } finally {
          setIsUploading(false);
        }
      } else if (typeof formData.proof === 'string') {
        // If proof is a string, it's already a URL, so use it directly
        proofUrl = formData.proof;
      }

      const formattedBookings = bookings.map((b) => {
        // Ensure dates are in DD-MM-YYYY format
        let startDate = b.startDate;
        let endDate = b.endDate;

        // If dates are in Date object format, convert to DD-MM-YYYY
        if (b.startDate instanceof Date) {
          startDate = formatDateForAPI(b.startDate);
        } else if (typeof b.startDate === 'string' && b.startDate.includes('T')) {
          // If it's an ISO string, convert to Date first
          startDate = formatDateForAPI(new Date(b.startDate));
        }

        if (b.endDate instanceof Date) {
          endDate = formatDateForAPI(b.endDate);
        } else if (typeof b.endDate === 'string' && b.endDate.includes('T')) {
          // If it's an ISO string, convert to Date first
          endDate = formatDateForAPI(new Date(b.endDate));
        }

        // Validate the formatted dates
        if (!/^\d{2}-\d{2}-\d{4}$/.test(startDate) || !/^\d{2}-\d{2}-\d{4}$/.test(endDate)) {
          throw new Error('Invalid date format. Please use DD-MM-YYYY format');
        }

        return {
          _id: b._id,
          categoryId: b.categoryId,
          subcategoryId: b.subcategoryId,
          startDate,
          endDate,
          price: b.price,
        };
      });

      const payload = {
        fullName: formData.fullName,
        mobile: formData.mobile,
        address: formData.address,
        total: formData.total,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        bookings: formattedBookings,
        deletedBookingIds,
        bill_created_by: formData.bill_created_by,
        // received_by: formData.received_by,
        paid_amount: formData.paid_amount,
        pending_amount: Math.max(0, formData.total - formData.paid_amount),
        refered_by: formData.refered_by,
        proof: proofUrl // Add the uploaded file URL to the payload
      };

      if (isEditMode && customerId) {
        await updateBooking(customerId, payload);
      } else {
        await createBooking(payload);
      }

      // showAppToast("Booking submitted successfully!", "success");
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      console.error("Submit failed:", error);
      showAppToast(`Error: ${error.message}`, "error");
    } finally {
      hideLoader();
      setIsUploading(false);
    }
  };

  // Helper function to format date as DD-MM-YYYY in local time
  const formatDateToDDMMYYYY = (date: Date): string => {
    // Convert to local date components to handle timezone correctly
    const localDate = new Date(date);
    const day = String(localDate.getDate()).padStart(2, '0');
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const year = localDate.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper function to parse dates from various formats to Date, handling timezone issues
  const parseDDMMYYYY = (dateStr: string): Date | null => {
    if (!dateStr) {
      console.warn('Empty date string provided');
      return null;
    }

    try {
      // Handle DD-MM-YYYY format (from frontend)
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-').map(Number);
        // Create date in local timezone without time components
        const date = new Date(year, month - 1, day, 0, 0, 0);

        // Validate the parsed date
        if (isNaN(date.getTime()) ||
          date.getDate() !== day ||
          date.getMonth() !== month - 1 ||
          date.getFullYear() !== year) {
          console.warn('Invalid DD-MM-YYYY date:', dateStr);
          return null;
        }
        return date;
      }

      // Handle YYYY-MM-DD format (from backend)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Create date in local timezone without time components
        const date = new Date(year, month - 1, day, 0, 0, 0);

        // Validate the parsed date
        if (isNaN(date.getTime()) ||
          date.getDate() !== day ||
          date.getMonth() !== month - 1 ||
          date.getFullYear() !== year) {
          console.warn('Invalid YYYY-MM-DD date:', dateStr);
          return null;
        }
        return date;
      }

      // If we get here, the format is not recognized
      console.warn('Unrecognized date format:', dateStr);
      return null;
    } catch (e) {
      console.warn('Invalid date format:', dateStr, e);
      return null;
    }
  };

  useEffect(() => {
    const fetchConflicts = async () => {
      if (!currentItemData.subcategoryId) {
        setDisabledDates([]);
        return;
      }

      try {
        // Get date range (3 months ahead)
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 3, 0);

        // Format dates as DD-MM-YYYY for the API
        const formattedStart = formatDateToDDMMYYYY(start);
        const formattedEnd = formatDateToDDMMYYYY(end);

        const res = await checkAvailability(
          currentItemData.subcategoryId,
          formattedStart,
          formattedEnd
        );

        const unavailableDates: Date[] = [];

        // Process conflicts from API - only disable specific booked dates
        if (res.conflicts && Array.isArray(res.conflicts)) {

          for (const conflict of res.conflicts) {
            if (!conflict.date) continue;

            // Get the current date range from the form state
            const currentStartDate = currentItemData.startDate;
            const currentEndDate = currentItemData.endDate;

            // Skip if this is the end date of a range (but not a single day booking)
            // Compare the dates directly without reformatting to avoid inconsistencies
            if (currentEndDate && conflict.date === currentEndDate && currentStartDate !== currentEndDate) {
              continue;
            }

            let conflictDate: Date | null = null;

            // Handle both DD-MM-YYYY and YYYY-MM-DD formats
            let dateParts: number[] = [];

            if (/^\d{2}-\d{2}-\d{4}$/.test(conflict.date)) {
              // DD-MM-YYYY format
              dateParts = conflict.date.split('-').map(Number);
              conflictDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], 12, 0, 0);
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(conflict.date)) {
              // YYYY-MM-DD format
              dateParts = conflict.date.split('-').map(Number);
              conflictDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);
            } else {
              console.warn('Unexpected date format:', conflict.date);
              continue;
            }

            if (!conflictDate || isNaN(conflictDate.getTime())) {
              console.warn('Failed to parse conflict date:', conflict.date);
              continue;
            }

            // Normalize the date to local time at noon to avoid timezone issues
            const normalizedDate = new Date(
              conflictDate.getFullYear(),
              conflictDate.getMonth(),
              conflictDate.getDate(),
              12, 0, 0, 0  // Set to noon to avoid timezone issues
            );

            // Skip adding to disabled dates if it's the current end date
            const isCurrentEndDate = currentItemData.endDate === conflict.date;

            if (!isCurrentEndDate) {
              const exists = unavailableDates.some((d: Date) => {
                return d.getTime() === normalizedDate.getTime();
              });

              if (!exists) {
                unavailableDates.push(normalizedDate);
              }
            }
          }
        }

        const existingBookingsForSubcategory = bookings.filter(b => {
          const matches = b?.subcategoryId === currentItemData.subcategoryId && b?.startDate && b?.endDate;
          return matches;
        });

        for (const booking of existingBookingsForSubcategory) {
          const bookingStart = parseDDMMYYYY(booking.startDate);
          const bookingEnd = parseDDMMYYYY(booking.endDate);

          if (bookingStart && bookingEnd) {
            // Handle single-day bookings
            if (bookingStart.getTime() === bookingEnd.getTime()) {
              const dateToAdd = new Date(bookingStart);
              const alreadyExists = unavailableDates.some(
                existing => existing.getTime() === dateToAdd.getTime()
              );
              if (!alreadyExists) {
                unavailableDates.push(dateToAdd);
              }
            } else {
              // Handle multi-day bookings
              const currentDate = new Date(bookingStart);
              while (currentDate < bookingEnd) {
                const dateToAdd = new Date(currentDate);
                const alreadyExists = unavailableDates.some(
                  existing => existing.getTime() === dateToAdd.getTime()
                );
                if (!alreadyExists) {
                  unavailableDates.push(dateToAdd);
                }
                currentDate.setDate(currentDate.getDate() + 1);
              }
            }
          }
        }

        // Remove duplicates while preserving the original date objects
        const uniqueDates = Array.from(
          new Map(
            unavailableDates.map(date => [date.getTime(), date])
          ).values()
        ).sort((a, b) => a.getTime() - b.getTime());
        setDisabledDates(uniqueDates);
      } catch (error) {
        console.error('Error fetching conflicts:', error);
        setDisabledDates([]);
      }
    };

    fetchConflicts();
  }, [currentItemData.subcategoryId, checkAvailability, bookings]);

  return (
    <div className="min-h-screen bg-[#E6E9F2]">
      <div className="flex justify-between">
        <p className="ml-[10px] text-black font-bold text-[24px]">New Booking</p>
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleDownloadInvoice}
            disabled={isgeneratingInvoice}
            className="bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isgeneratingInvoice ? "Generating..." : "Download Invoice"}
          </button>
        </div>
      </div>
      <main className="px-2 pb-2 overflow-x-hidden">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Personal Information</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="full_name" required className={`w-full border rounded-lg p-2 text-black ${errors.fullName ? "border-red-500" : "border-gray-300"}`} value={formData.fullName} onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))} />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                <input type="text" name="mobile" required className={`w-full border rounded-lg p-2 text-black ${errors.mobile ? "border-red-500" : "border-gray-300"}`} value={formData.mobile} onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData((prev) => ({ ...prev, mobile: value }));
                }} />
                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                <textarea name="address" required className={`w-full border rounded-lg p-2 h-24 text-black ${errors.address ? "border-red-500" : "border-gray-300"}`} value={formData.address} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}></textarea>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bill created by  <span className="text-red-500">*</span></label>
                <input type="text" name="bill_created_by" className={`w-full border rounded-lg p-2 text-black ${errors.bill_created_by ? "border-red-500" : "border-gray-300"}`} value={formData.bill_created_by} onChange={(e) => setFormData((prev) => ({ ...prev, bill_created_by: e.target.value }))} />
                {errors.bill_created_by && <p className="text-red-500 text-xs mt-1">{errors.bill_created_by}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference By</label>
                <input type="text" name="refered_by" className={`w-full border rounded-lg p-2 text-black ${errors.refered_by ? "border-red-500" : "border-gray-300"}`} value={formData.refered_by} onChange={(e) => setFormData((prev) => ({ ...prev, refered_by: e.target.value }))} />
                {errors.refered_by && <p className="text-red-500 text-xs mt-1">{errors.refered_by}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Proof (Optional)</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                      <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <span className="text-sm text-gray-600">
                        {filePreview || formData.proof ? 'Change File' : 'Choose File'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData(prev => ({ ...prev, proof: file }));
                            // Create preview for images
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFilePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setFilePreview(null);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {filePreview && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
                      <div className="relative inline-block">
                        {formData.proof ? (
                          <div className="relative h-32 w-32">
                            <Image
                              src={typeof formData.proof === 'string' ? formData.proof : URL.createObjectURL(formData.proof)}
                              alt="Document preview"
                              fill
                              className="rounded border border-gray-200 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="%236b7280" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
                                target.className = 'h-32 w-32 p-4 bg-gray-100 rounded border border-gray-200';
                              }}
                            />
                          </div>
                        ) : filePreview ? (
                          <div className="relative h-32 w-32">
                            <Image
                              src={filePreview}
                              alt="Document preview"
                              fill
                              className="rounded border border-gray-200 object-cover"
                            />
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setFilePreview(null);
                            setFormData(prev => ({ ...prev, proof: null }));
                            // Reset file input
                            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {formData.proof && !filePreview && (
                    <div className="mt-2 flex items-center">
                      <span className="text-sm text-gray-600">{formData.proof.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, proof: null }));
                          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold mt-10 mb-4 text-gray-800">Booking Details</h2>
            <div className="w-full md:w-1/2 pr-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Category <span className="text-red-500">*</span></label>
              <select
                name="category_id"
                className={`w-full border rounded-lg p-2 text-sm truncate text-black
                  ${errors.categoryId ? "border-red-500" : "border-gray-300"}
                  ${bookings.length > 0 ? "bg-gray-100 cursor-not-allowed" : "bg-white cursor-pointer"}`
                }
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                // CHANGE: Disable category selection if items are already added
                disabled={isCategoriesLoading || bookings.length > 0}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t mt-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Subcategory <span className="text-red-500">*</span></label>
                <Select
                  options={subCategories.map(sub => ({
                    value: sub._id,
                    label: `${sub.serialNumber} ${sub.name}`
                  }))}
                  value={{
                    value: currentItemData.subcategoryId,
                    label: subCategories.find(sub => sub._id === currentItemData.subcategoryId)
                      ? `${subCategories.find(sub => sub._id === currentItemData.subcategoryId)?.serialNumber} ${subCategories.find(sub => sub._id === currentItemData.subcategoryId)?.name}`
                      : 'Select Subcategory'
                  }}
                  onChange={(selectedOption) => setCurrentItemData((prev) => ({
                    ...prev,
                    subcategoryId: selectedOption?.value || ''
                  }))}
                  isDisabled={!selectedCategory}
                  className={`text-sm ${errors.subcategoryId ? 'border-red-500' : 'border-gray-300'}`}
                  classNamePrefix="select"
                  placeholder="Search or select subcategory..."
                  isSearchable
                  noOptionsMessage={() => 'No subcategories found'}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '42px',
                      borderColor: errors.subcategoryId ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                      '&:hover': {
                        borderColor: errors.subcategoryId ? '#ef4444' : state.isFocused ? '#3b82f6' : '#9ca3af'
                      },
                      backgroundColor: !selectedCategory ? '#f3f4f6' : 'white',
                      cursor: !selectedCategory ? 'not-allowed' : 'pointer',
                      opacity: !selectedCategory ? 0.7 : 1
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),
                    option: (base, state) => ({
                      ...base,
                      fontSize: '0.875rem',
                      padding: '8px 12px',
                      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                      color: state.isSelected ? 'white' : '#1f2937',
                      '&:active': {
                        backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb'
                      },
                      cursor: 'pointer'
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: !selectedCategory ? '#9ca3af' : '#1f2937'
                    })
                  }}
                />
                {errors.subcategoryId && <p className="text-red-500 text-xs mt-1">{errors.subcategoryId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price <span className="text-red-500">*</span></label>
                <input type="number" name="price" placeholder="Enter price" className={`w-full border rounded-lg p-2 text-black ${!selectedCategory ? "bg-gray-100 cursor-not-allowed text-gray-400" : "bg-white"} ${errors.price ? "border-red-500" : "border-gray-300"}`} value={currentItemData.price} onChange={(e) => setCurrentItemData((prev) => ({ ...prev, price: e.target.value }))} disabled={!selectedCategory} />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <CustomDatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    const dateStr = date ? formatDateToLocalYYYYMMDD(date) : "";
                    setCurrentItemData(prev => ({ ...prev, startDate: dateStr }));

                    // If end date is before new start date, clear it
                    if (endDate && date && endDate < date) {
                      setEndDate(null);
                      setCurrentItemData(prev => ({ ...prev, endDate: "" }));
                    }
                  }}
                  disabledDates={disabledDates}
                  disabled={!selectedCategory}
                  allowPastDates={canBookBackDate}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <CustomDatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    setCurrentItemData(prev => ({
                      ...prev,
                      endDate: date ? formatDateToLocalYYYYMMDD(date) : ""
                    }));
                  }}
                  disabledDates={disabledDates}
                  disabled={!selectedCategory || !startDate}
                  isEndDate={true}
                  startDate={startDate}
                  minDate={startDate} // Ensure end date can't be before start date
                  allowPastDates={canBookBackDate}
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
              <div className="flex items-end col-span-1 md:col-span-2">
                <button type="button" onClick={handleAddBooking} disabled={!selectedCategory} className="w-full md:w-auto font-semibold py-2 px-8 rounded-lg transition-colors duration-200 bg-red-700 hover:bg-red-800 text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed">
                  Add Item
                </button>
              </div>
            </div>

            <div className="mt-8 w-full">
              <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Booking Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-sm text-gray-800">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left border-b">Sr. no</th>
                        <th className="px-4 py-2 text-left border-b">Category</th>
                        <th className="px-4 py-2 text-left border-b">Serial No</th>
                        <th className="px-4 py-2 text-left border-b">Subcategory</th>
                        <th className="px-4 py-2 text-left border-b">Price</th>
                        <th className="px-4 py-2 text-left border-b">Start Date</th>
                        <th className="px-4 py-2 text-left border-b">End Date</th>
                        <th className="px-4 py-2 text-center border-b">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {[...bookings].reverse().map((b, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-2 text-left">{index + 1}</td>
                          <td className="px-4 py-2 text-left">{b?.categoryName || "-"}</td>
                          <td className="px-4 py-2 text-left">{b?.serialNumber || "-"}</td>
                          <td className="px-4 py-2 text-left">{b?.subcategoryName || "-"}</td>
                          <td className="px-4 py-2 text-left">{b.price}</td>
                          <td className="px-4 py-2 text-left">{b.startDate}</td>
                          <td className="px-4 py-2 text-left">{b.endDate}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                // Calculate the actual index in the original array (before reverse)
                                const actualIndex = bookings.length - 1 - index;
                                const bookingToDelete = bookings[actualIndex];
                                if (bookingToDelete?._id) {
                                  setDeletedBookingIds((prev) => [...prev, bookingToDelete._id]);
                                }

                                // Remove the booking and update the total if not manually edited
                                setBookings((prev) => prev.filter((_, i) => i !== actualIndex));
                                setIsTotalManuallyEdited(false);
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method <span className="text-red-500">*</span></label>
                <select name="paymentMethod" className={`w-full border rounded-lg p-2 text-black ${errors.payment_method ? "border-red-500" : "border-gray-300"}`} value={formData.payment_method} onChange={(e) => setFormData((prev) => ({ ...prev, payment_method: e.target.value }))}>
                  <option value="">Select Payment Method</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                </select>
                {errors.payment_method && <p className="text-red-500 text-xs mt-1">{errors.payment_method}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status <span className="text-red-500">*</span></label>
                <select name="paymentStatus" className={`w-full border rounded-lg p-2 text-black ${errors.payment_status ? "border-red-500" : "border-gray-300"}`} value={formData.payment_status} onChange={(e) => setFormData((prev) => ({ ...prev, payment_status: e.target.value }))}>
                  <option value="">Select Payment Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Un-Paid</option>
                </select>
                {errors.payment_status && <p className="text-red-500 text-xs mt-1">{errors.payment_status}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <input
                  type="number"
                  name="total"
                  className="w-full border border-gray-300 rounded-lg p-2 text-black"
                  value={formData.total || ''}
                  onChange={handleTotalChange}
                  onBlur={(e) => {
                    // Ensure we always have a valid number, even if field is cleared
                    if (e.target.value === '') {
                      const calculatedTotal = bookings.reduce((acc, cur) => acc + Number(cur.price || 0), 0);
                      setFormData(prev => ({
                        ...prev,
                        total: calculatedTotal,
                        pending_amount: Math.max(0, calculatedTotal - (prev.paid_amount || 0))
                      }));
                      setIsTotalManuallyEdited(false);
                    }
                  }}
                  min={0}
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="paid_amount"
                  placeholder="Enter Paid Amount"
                  className={`w-full border rounded-lg p-2 text-black ${errors.paid_amount ? "border-red-500" : "border-gray-300"}`}
                  value={formData.paid_amount}
                  onChange={(e) => {
                    const paid = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({
                      ...prev,
                      paid_amount: paid,
                      pending_amount: Math.max(0, (prev.total || 0) - paid)
                    }));
                  }}
                  min={0}
                  max={formData.total}
                />
                {errors.paid_amount && <p className="text-red-500 text-xs mt-1">{errors.paid_amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pending Amount</label>
                <input
                  type="number"
                  name="pending_amount"
                  className="w-full border border-gray-300 rounded-lg p-2 text-black bg-gray-100 cursor-not-allowed"
                  value={formData.pending_amount || 0}
                  readOnly
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className={`bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-6 rounded-lg ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Submit Booking'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
