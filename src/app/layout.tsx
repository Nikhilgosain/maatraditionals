import type { Metadata } from "next";
import "../styles/globals.css";
import GlobalLoader from '@/components/common/Loader';
import SnackbarInitializerProvider from "@/components/SnackbarInitializer";

export const metadata: Metadata = {
  title: "Maa Traditional Dresses",
  description: "Rent traditional clothes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <GlobalLoader />
        <SnackbarInitializerProvider>
          {children}
        </SnackbarInitializerProvider>
      </body>
    </html>
  );
}
