"use client";

import { AdminProvider, useAdmin } from "@/Hooks/use-admin-context";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import AdminSidebar from "./Sidebar";
import { usePathname, useRouter } from "next/navigation";

// const fetchAdminData = async () => {
//   const res = await fetch("/api/admin"); // Your API endpoint
//   if (!res.ok) {
//     const errorData = await res.json();
//     throw new Error(errorData.error || "Failed to fetch admin data.");
//   }
//   return res.json();
// };

const AdminDashboardLayout = ({
  children, // This is where your page.tsx content will be rendered
  defaultOpen,
  adminToken,
}: {
  children: React.ReactNode;
  defaultOpen: boolean;
  adminToken?: string | undefined;
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const { admin, isAuthenticated, isLoading } = useAdmin();

  if (!adminToken) {
    router.push(`/admin/login?redirectUrl=${encodeURIComponent(pathname)}`);
    return null;
  }

  return (
    // <AdminProvider adminToken={adminToken}>
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar
        name={admin?.name || "Admin"}
        email={admin?.email || "admin@shop.co"}
      />

      <SidebarInset>
        <SidebarTrigger className="-ml-1" />

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
    // </AdminProvider>
  );
};

export default AdminDashboardLayout;
