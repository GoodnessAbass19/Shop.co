// components/seller/SellerDashboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Utility for merging Tailwind classes
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"; // For data fetching
import {
  User,
  Role,
  Product,
  ProductVariant,
  Category,
  SubCategory,
  SubSubCategory,
  OrderItem,
  Order,
  Address,
} from "@prisma/client";

// Placeholder components for each dashboard page
import { DashboardOverview } from "./DashboardOverview";
import { ProductManagement } from "./ProductManagement";
import { OrderManagement } from "./OrderManagement";
import { SalesAnalytics } from "./SalesAnalytics";
import { InventoryManagement } from "./InventoryManagement";
import { DiscountManagement } from "./DiscountManagement";
import { StoreSettings } from "./StoreSettings";
import { CustomerMessages } from "./CustomerMessages";
import { ProductReviews } from "./ProductReviews";

// Define the structure of the SellerStore data expected from the API
interface SellerStore {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  banners: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // Include relations as fetched by your API route
  products: (Product & {
    variants: ProductVariant[];
    category: Category;
    subCategory: SubCategory | null;
    subSubCategory: SubSubCategory | null;
  })[];
  orderItems: (OrderItem & {
    order: Order & {
      buyer: User;
      address: Address; // Assuming Address is included in Order
    };
  })[];
}

// Define navigation items
const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, component: DashboardOverview },
  { name: "Products", icon: Package, component: ProductManagement },
  { name: "Orders", icon: ShoppingBag, component: OrderManagement },
  { name: "Sales & Analytics", icon: BarChart, component: SalesAnalytics },
  { name: "Inventory", icon: Warehouse, component: InventoryManagement },
  { name: "Discounts", icon: Percent, component: DiscountManagement },
  { name: "Store Settings", icon: Settings, component: StoreSettings },
  { name: "Messages", icon: MessageSquare, component: CustomerMessages },
  { name: "Reviews", icon: Star, component: ProductReviews },
];

// Function to fetch seller's store data
const fetchSellerStore = async (): Promise<{ store: SellerStore }> => {
  const res = await fetch("/api/store"); // Your API endpoint
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch seller store data.");
  }
  return res.json();
};

export function SellerDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  // Fetch seller's store data
  const { data, isLoading, isError, error } = useQuery<
    { store: SellerStore },
    Error
  >({
    queryKey: ["sellerStore"],
    queryFn: fetchSellerStore,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Retry once if it fails
  });

  const sellerStore = data?.store; // Extract the store object

  // Close sidebar on page change for mobile
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [activePage]);

  // Determine the component to render based on activePage
  const ActiveComponent = navItems.find(
    (item) => item.name === activePage
  )?.component;

  // Handle loading state for the main store data
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-700">
        <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-4" />
        <p className="text-xl font-medium">Loading your seller dashboard...</p>
      </div>
    );
  }

  // Handle error state for the main store data
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-800 p-8 text-center">
        <X className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="mb-4">
          {error?.message ||
            "An unknown error occurred while fetching your store data."}
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Handle case where no store is found for the user
  if (!sellerStore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 text-yellow-800 p-8 text-center">
        <StoreIcon className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Store Found</h2>
        <p className="mb-4">
          It looks like you don't have a store yet. Please create one to access
          the dashboard.
        </p>
        <Link href="/create-store">
          {" "}
          {/* Adjust this path to your store creation form */}
          <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
            Create Your Store
          </Button>
        </Link>
      </div>
    );
  }

  // Function to handle logout (placeholder)
  const handleLogout = () => {
    // Implement your logout logic here (e.g., clear token, redirect to login)
    console.log("Logging out...");
    // Example: router.push('/sign-in');
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-inter">
      {/* Mobile Header */}
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
          <h2 className="text-xl font-extrabold text-blue-400">
            {sellerStore.name || "Seller Hub"}
          </h2>
        </div>
        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                "w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200",
                activePage === item.name
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
              onClick={() => setActivePage(item.name)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Button>
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

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-4 overflow-y-auto">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-40px)]">
          {/* Pass sellerStore data to the active component */}
          {ActiveComponent ? (
            <ActiveComponent
            // store={sellerStore}
            />
          ) : (
            <DashboardOverview
            // store={sellerStore}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default SellerDashboard;
