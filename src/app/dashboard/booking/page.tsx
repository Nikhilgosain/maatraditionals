import { Suspense } from 'react';
import BookingClient from './BookingClient'; // We will create this component in the next step

// A simple loading component to show as a fallback
function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <h2 className="text-xl font-bold">Loading Booking Details...</h2>
    </div>
  );
}

export default function BookingPage() {
  // This is the Server Component that provides the Suspense boundary
  return (
    <Suspense fallback={<Loading />}>
      <BookingClient />
    </Suspense>
  );
}