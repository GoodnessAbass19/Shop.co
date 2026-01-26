"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { User } from "@prisma/client";

// Define Admin data types
interface AdminData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  permissions?: string[];
}

interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingVerifications: number;
}

interface AdminContextType {
  admin: AdminData | null;
  stats: AdminStats | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchAdmin: () => void;
  refetchStats: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
  adminToken?: string | null;
}

export const AdminProvider = ({ children, adminToken }: AdminProviderProps) => {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const fetchAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/admin");
      if (!res.ok) {
        setAdmin(null);
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      setAdmin(data.admin ?? null);
      setIsAuthenticated(!!data.admin);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      setAdmin(null);
      setIsAuthenticated(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        setStats(null);
        return;
      }
      const data = await res.json();
      setStats(data.stats ?? null);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      setStats(null);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true);

      // Validate admin token on startup
      if (!adminToken) {
        setIsLoading(false);
        return;
      }

      try {
        await fetchAdmin();
        await fetchStats();
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, [adminToken, fetchAdmin, fetchStats]);

  const value: AdminContextType = {
    admin,
    stats,
    isLoading,
    isAuthenticated,
    refetchAdmin: fetchAdmin,
    refetchStats: fetchStats,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

// Custom hook to use the AdminContext
export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
