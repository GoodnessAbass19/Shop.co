"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Cart, CartItem, User } from "@prisma/client";
import { cookies } from "next/headers";

// Define Notification type if not imported
type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  // Add other fields as needed
};

interface UserContextType {
  user: User | null;
  notifications: Notification[];
  cart: (Cart & { cartItems: CartItem[] }) | null;
  isLoading: boolean;
  refetchUser: () => void;
  refetchNotifications: () => void;
  refetchCart: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  token: string | null;
}

export const UserProvider = ({ children, token }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cart, setCart] = useState<(Cart & { cartItems: CartItem[] }) | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user ?? null);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUser(null);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?role=BUYER");
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) {
        setCart(null);
        return;
      }
      const data = await res.json();
      setCart(data.cart ?? null);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setCart(null);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Validate token on startup by calling /api/me once. This ensures token is
      // actually valid before doing additional fetches.
      try {
        if (!token) {
          setUser(null);
          setNotifications([]);
          setCart(null);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // If validation fails for any reason, proceed with the regular fetches
        console.warn("checkUserToken failed, proceeding with fetches:", err);
      }

      await Promise.all([fetchUser(), fetchNotifications(), fetchCart()]);
      setIsLoading(false);
    };
    fetchData();
  }, [fetchUser, fetchNotifications, fetchCart, token]);

  const value: UserContextType = {
    user,
    notifications,
    cart,
    isLoading,
    refetchUser: fetchUser,
    refetchNotifications: fetchNotifications,
    refetchCart: fetchCart,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Helper to read a cookie by name (client-side)
// function readCookie(name: string): string | null {
//   if (typeof document === "undefined") return null;
//   const match = document.cookie.match(
//     new RegExp("(?:^|; )" + name + "=([^;]*)")
//   );
//   return match ? decodeURIComponent(match[1]) : null;
// }

// // Returns the raw token string from cookies (or null)
// export function getUserToken(): string | null {
//   return readCookie("token");
// }

// // Checks whether a token exists and is valid by calling the `/api/me` endpoint.
// // Returns `true` if a valid token is present, `false` otherwise.
// export async function checkUserToken(): Promise<boolean> {
//   if (typeof window === "undefined") return false;
//   const token = getUserToken();
//   if (!token) return false;
//   console.log(token);
//   try {
//     const res = await fetch("/api/me");
//     if (!res.ok) return false;
//     const data = await res.json();
//     return !!data?.user;
//   } catch (err) {
//     console.error("checkUserToken error:", err);
//     return false;
//   }
// }
