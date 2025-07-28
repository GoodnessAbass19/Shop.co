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
import { HoverPrefetchLink } from "@/lib/HoverLink";

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
    staleTime: 10 * 60 * 1000, // Data considered fresh for 5 minutes
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
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
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
        <HoverPrefetchLink href="/create-store">
          {" "}
          {/* Adjust this path to your store creation form */}
          <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
            Create Your Store
          </Button>
        </HoverPrefetchLink>
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
    <div
    // className="flex min-h-screen bg-gray-100 font-inter"
    >
      <DashboardOverview />
    </div>
  );
}

export default SellerDashboard;
