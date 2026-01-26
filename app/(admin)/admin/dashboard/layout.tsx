import AdminDashboardLayout from "@/components/admin/Layout";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AdminProvider } from "@/Hooks/use-admin-context";
import { cookies } from "next/headers";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const adminToken = cookieStore.get("admin-token")?.value;

  return (
    <main className="" suppressHydrationWarning>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <AdminProvider adminToken={adminToken}>
          <AdminDashboardLayout
            children={children}
            defaultOpen={defaultOpen}
            adminToken={adminToken}
          />
        </AdminProvider>
      </ThemeProvider>
    </main>
  );
}
// s@FAJADNBB6va9r
