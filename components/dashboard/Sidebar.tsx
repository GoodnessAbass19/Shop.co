// components/seller/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // To highlight active link
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart,
  Warehouse,
  Percent,
  Settings,
  MessageSquare,
  Star,
  LogOut,
  Menu,
  X,
  Store as StoreIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";

// Define the type for a navigation item
interface NavItem {
  name: string;
  icon: React.ElementType; // For LucideReact icons
  href: string;
}

interface SidebarProps {
  storeName: string;
  navItems: NavItem[]; // Pass the navItems from SellerDashboardLayout
}

export function Sidebar({ storeName, navItems }: SidebarProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [pathname]); // Close sidebar when pathname changes

  const handleLogout = () => {
    // Implement your logout logic here (e.g., clear token, redirect to login)
    console.log("Logging out...");
    // Example: router.push('/sign-in');
  };

  return (
    <>
      {/* Mobile Header (Still rendered by Sidebar as it controls the sidebar toggle) */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm p-4 flex items-center justify-between z-40">
        <div className="flex items-center">
          <StoreIcon className="h-7 w-7 text-blue-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-800">Seller Dashboard</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-600 hover:bg-gray-100"
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-gray-900 text-white shadow-lg transform transition-transform duration-300 ease-in-out z-50",
          "md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-2 py-3 flex items-center justify-center border-b border-gray-700">
          <StoreIcon className="h-6 w-6 text-blue-400 mr-1.5" />
          <h2 className="text-xl font-extrabold text-blue-400 capitalize">
            {storeName || "Seller Hub"}
          </h2>
        </div>
        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200",
                // Highlight active link based on pathname.startsWith for nested routes
                pathname === item.href
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
              // Removed onClick={() => setActivePage(item.name)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-0 w-full px-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
