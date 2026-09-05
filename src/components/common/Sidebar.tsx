import Link from 'next/link';
import { Home, Upload, LogOut, LayoutDashboard, List, ListCheck, CreditCard } from 'lucide-react'; // Use Lucide icons
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    closeSidebar();
    await logout();
  };

  const handleLinkClick = () => {
    closeSidebar();
  };

  return (
    <aside
      className={`fixed top-0 left-0 w-64 h-full bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 z-40 lg:translate-x-0 lg:relative lg:h-screen lg:block ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Mobile Only Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center lg:hidden">
        <span className="font-semibold text-lg text-gray-700">Menu</span>
        <button onClick={closeSidebar} className="text-xl text-gray-600">
          &times;
        </button>
      </div>

      {/* Nav Items */}
      <nav className="p-4 space-y-2">
        <Link
          href="/dashboard"
          onClick={handleLinkClick}
          className="flex items-center gap-3 text-gray-700 hover:bg-[#F0A611]/10 hover:text-[#ce000c] px-4 py-2 rounded-lg transition-all"
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </Link>
        <Link
          href="/dashboard/booking"
          onClick={handleLinkClick}
          className="flex items-center gap-3 text-gray-700 hover:bg-[#F0A611]/10 hover:text-[#ce000c] px-4 py-2 rounded-lg transition-all"
        >
          <Home className="w-5 h-5" /> Booking Form
        </Link>
        <Link
          href="/dashboard/summary"
          onClick={handleLinkClick}
          className="flex items-center gap-3 text-gray-700 hover:bg-[#F0A611]/10 hover:text-[#ce000c] px-4 py-2 rounded-lg transition-all"
        >
          <ListCheck className="w-5 h-5" /> Booking Summary
        </Link>
        <Link
          href="/dashboard/upload"
          onClick={handleLinkClick}
          className="flex items-center gap-3 text-gray-700 hover:bg-[#F0A611]/10 hover:text-[#ce000c] px-4 py-2 rounded-lg transition-all"
        >
          <Upload className="w-5 h-5" /> Upload
        </Link>
        <Link
          href="/dashboard/inventory"
          onClick={handleLinkClick}
          className="flex items-center gap-3 text-gray-700 hover:bg-[#F0A611]/10 hover:text-[#ce000c] px-4 py-2 rounded-lg transition-all"
        >
          <List className="w-5 h-5" /> Inventory
        </Link>
        <Link
          href="/dashboard/payments"
          onClick={handleLinkClick}
          className="flex items-center gap-3 text-gray-700 hover:bg-[#F0A611]/10 hover:text-[#ce000c] px-4 py-2 rounded-lg transition-all"
        >
          <CreditCard className="w-5 h-5" /> Payments
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-gray-700 hover:bg-[#F0A611]/10 hover:text-[#ce000c] px-4 py-2 rounded-lg transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </nav>
    </aside>
  );
}
