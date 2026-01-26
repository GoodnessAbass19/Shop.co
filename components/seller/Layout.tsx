// app/dashboard/seller/layout.tsx
"use client";

import { Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
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
  BusinessInfo,
  ShippingInfo,
} from "@prisma/client";
import { SellerStoreProvider } from "@/Hooks/use-store-context";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { AppSidebar } from "../dashboard/NewSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useUserRole } from "@/Hooks/use-user-role";

// Define the structure of the SellerStore data expected from the API
interface SellerStoreData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  banners: string[];
  contactEmail: string;
  country: string;
  state: string;
  contactPhone: string;
  accountType: string;
  contact: Contact;
  customerCare: CustomerCare;
  businessInfo: BusinessInfo | null;
  shippingInfo: ShippingInfo;
  userId: string;
  user: User;
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
  isactive: boolean;
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
  storeToken,
}: {
  children: React.ReactNode;
  defaultOpen: boolean;
  storeToken?: string | undefined;
}) {
  const { isSeller, isLoading: isRoleLoading } = useUserRole();

  // Fetch seller's store data
  const { data, isLoading, isError, error } = useQuery<
    { store: SellerStoreData },
    Error
  >({
    queryKey: ["sellerStore"],
    queryFn: fetchSellerStore,
    staleTime: 10 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false,
    enabled: isSeller === true && !!storeToken, // Only run the query if storeToken is available
    retry: 1, // Retry once if it fails
  });

  const sellerStore = data?.store;
  const pathname = usePathname();
  const router = useRouter();

  // Handle loading state for the main store data
  if (isRoleLoading || isLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  // Handle case where no store is found for the user
  if (pathname === "/your/store/create" && !sellerStore) {
    router.prefetch(`/sign-in`);
    router.push(
      `/sign-in?redirectUrl=${encodeURIComponent("/your/store/create")}`,
    );
    return null;
  }

  // verify seller status and store data security
  if (isSeller === false || !storeToken) {
    router.push(
      `/your/store/login?redirectUrl=${encodeURIComponent(pathname)}`,
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
    </SellerStoreProvider>
  );
}
