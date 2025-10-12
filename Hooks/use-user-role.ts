import {
  Address,
  BusinessInfo,
  Category,
  Contact,
  CustomerCare,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  ShippingInfo,
  SubCategory,
  SubSubCategory,
  User,
} from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
}

interface UserStatus {
  isRider?: boolean;
  isSeller?: boolean;
  storeContactEmail?: string;
  store?: SellerStoreData;
}

// Function to fetch the user's current status
const fetchUserStatus = async (): Promise<UserStatus> => {
  const res = await fetch("/api/me"); // Assuming you have a route to get current user data
  if (!res.ok) {
    throw new Error("Failed to fetch user status");
  }
  const data = await res.json();
  return {
    isRider: data.user?.isRider,
    isSeller: data.user?.isSeller,
    storeContactEmail: data.user.store.contactEmail,
    store: data.user.store!,
  };
};

// Function to update the user's status
const updateUserStatus = async (status: UserStatus): Promise<UserStatus> => {
  const res = await fetch("/api/update-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(status),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update status");
  }
  const data = await res.json();
  return { isRider: data.isRider, isSeller: data.isSeller };
};

export function useUserRole() {
  const queryClient = useQueryClient();

  // Use useQuery to get the initial status
  const { data, isLoading, isError } = useQuery<UserStatus, Error>({
    queryKey: ["userStatus"],
    queryFn: fetchUserStatus,
    staleTime: 10 * 60 * 1000, // The role won't change unless the user explicitly switches
  });

  // Use useMutation to handle the API call to update the role
  const {
    mutateAsync: switchRole,
    isPending: isSwitching,
    isError: switchError,
  } = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: (updatedStatus) => {
      // Manually update the cache to reflect the new role
      queryClient.setQueryData(["userStatus"], updatedStatus);
      // Invalidate the 'current-user' query to ensure other parts of the app get the latest data
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });

  const switchToRider = async () => {
    if (data?.isRider) return; // Already a rider, do nothing
    await switchRole({ isRider: true, isSeller: false });
  };

  const switchToSeller = async () => {
    if (data?.isSeller) return; // Already a seller, do nothing
    await switchRole({ isSeller: true, isRider: false });
  };

  const clearRole = async () => {
    await switchRole({ isSeller: false, isRider: false });
  };

  return {
    isRider: data?.isRider,
    isSeller: data?.isSeller,
    contactEmail: data?.storeContactEmail,
    store: data?.store,
    isLoading,
    isError,
    isSwitching,
    switchError,
    switchToRider,
    switchToSeller,
    clearRole,
  };
}
