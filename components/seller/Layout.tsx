// app/dashboard/seller/layout.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Loader2,
  X,
  Store as StoreIcon,
  Package,
  ShoppingBag,
  BarChart,
  Warehouse,
  Percent,
  Settings,
  MessageSquare,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
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
  Contact,
  CustomerCare,
} from "@prisma/client";
import { Sidebar } from "../dashboard/Sidebar";
import { SellerStoreProvider } from "@/Hooks/use-store-context";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { AppSidebar } from "../dashboard/NewSidebar";
import { usePathname, useRouter } from "next/navigation";
// import { cookies } from "next/headers";

// Define the structure of the SellerStore data expected from the API
interface SellerStoreData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  banners: string[];
  contactEmail: string;
  country: string;
  contactPhone: string;
  accountType: string;
  contact: Contact;
  customerCare: CustomerCare;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  products: (Product & {
    variants: ProductVariant[];
    category: Category;
    subCategory: SubCategory | null;
    subSubCategory: SubSubCategory | null;
  })[];
  orderItems: (OrderItem & {
    order: Order & {
      buyer: User;
      address: Address;
    };
  })[];
}

// Function to fetch seller's store data
const fetchSellerStore = async (): Promise<{ store: SellerStoreData }> => {
  const res = await fetch("/api/store"); // Your API endpoint
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch seller store data.");
  }
  return res.json();
};

// Main Layout Component
export default function SellerDashboardLayout({
  children, // This is where your page.tsx content will be rendered
  defaultOpen,
}: {
  children: React.ReactNode;
  defaultOpen: boolean;
}) {
  // Fetch seller's store data
  const { data, isLoading, isError, error } = useQuery<
    { store: SellerStoreData },
    Error
  >({
    queryKey: ["sellerStore"],
    queryFn: fetchSellerStore,
    staleTime: 10 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Retry once if it fails
  });

  const sellerStore = data?.store;
  const pathname = usePathname();
  const router = useRouter();
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
  // if (isError) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-800 p-8 text-center">
  //       <X className="w-16 h-16 text-red-500 mb-4" />
  //       <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
  //       <p className="mb-4">
  //         {error?.message ||
  //           "An unknown error occurred while fetching your store data."}
  //       </p>
  //       <Button
  //         onClick={() => window.location.reload()}
  //         className="bg-red-600 hover:bg-red-700 text-white"
  //       >
  //         Try Again
  //       </Button>
  //     </div>
  //   );
  // }

  // Handle case where no store is found for the user
  if (pathname === "/your/store/create" && !sellerStore) {
    router.prefetch(`/sign-in`);
    router.push(
      `/sign-in?redirectUrl=${encodeURIComponent("/your/store/create")}`
    );
    return null;
  }

  if (!sellerStore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 text-yellow-800 p-8 text-center">
        <StoreIcon className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Store Found</h2>
        <p className="mb-4">
          It looks like you don't have a store yet. Please create one to access
          the dashboard.
        </p>
        <HoverPrefetchLink href="/your/store/create">
          {" "}
          {/* Adjust this path to your store creation form */}
          <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
            Create Your Store
          </Button>
        </HoverPrefetchLink>
      </div>
    );
  }

  return (
    <SellerStoreProvider store={sellerStore}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar
          storeName={sellerStore.name}
          email={sellerStore.contactEmail}
          logo={sellerStore.logo! || "https://via.placeholder.com/200"}
        />

        <SidebarInset>
          <SidebarTrigger className="-ml-1" />

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      {/* Provide store data to children */}
      {/* <div className="flex min-h-screen bg-gray-100 font-inter"> */}
      {/* Sidebar is now a separate component */}
      {/* <Sidebar
          storeName={sellerStore.name}
          navItems={navItems}
          email={sellerStore.user.email}
          logo={sellerStore.logo! || "https://via.placeholder.com/200"}
        />{" "} */}
      {/* No setActivePage needed */}
      {/* Main Content Area */}
      {/* Adjusted padding-top (pt-20) for mobile fixed header */}
      {/* <main className="flex-1 p-4 md:p-8 pt-20 md:pt-4 overflow-y-auto">
          <div className="max-w-full mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-40px)]">
            {children}{" "}
            This is where the specific page content will be rendered
          </div>
        </main> */}
      {/* </div> */}
    </SellerStoreProvider>
  );
}
