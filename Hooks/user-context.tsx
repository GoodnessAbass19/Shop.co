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
}

export const UserProvider = ({ children }: UserProviderProps) => {
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
      await Promise.all([fetchUser(), fetchNotifications(), fetchCart()]);
      setIsLoading(false);
    };
    fetchData();
  }, [fetchUser, fetchNotifications, fetchCart]);

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
