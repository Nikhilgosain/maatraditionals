'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    // Body and main container from the HTML theme
    <div className="bg-gradient-to-br from-[#F0A611] to-[#f9de59] min-h-screen flex items-center justify-center relative">
      <div className="flex justify-center items-center min-h-screen px-4 py-12">
        <div className="relative w-full max-w-md">

          {/* Logo (responsive + centered) */}
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-10">
            {/* Using Next.js Image component for optimization */}
            <Image
              src="/logo.png" // Path relative to the `public` directory
              alt="Logo"
              width={160} // Set a base width, Tailwind classes will override for responsiveness
              height={160} // Set a base height, Tailwind classes will override for responsiveness
              priority // Prioritize loading of this image
              className="w-32 sm:w-20 lg:w-40 h-auto object-contain transition-transform duration-500 ease-in-out hover:scale-105"
            />
          </div>

          {/* Card with padding to make room for logo */}
          <div className="bg-white rounded-2xl shadow-2xl pt-24 pb-8 px-6">
            <h1 className="text-2xl font-bold text-center mb-6 text-black">Admin Login</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email" // Changed to email for better validation UX
                placeholder="Admin Email" // Changed placeholder
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 p-4 rounded-xl bg-gray-100 text-gray-700 placeholder:text-gray-500 focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 p-4 rounded-xl bg-gray-100 text-gray-700 placeholder:text-gray-500 focus:outline-none"
                required
              />

              
              <button
                type="submit"
                disabled={isLoading} // Disable button when loading
                className="w-full h-12 bg-[#ce000c] hover:bg-[#a50000] text-white font-bold rounded-full transition"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}