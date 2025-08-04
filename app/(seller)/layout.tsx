import { ThemeProvider } from "@/components/layout/theme-provider";
import SellerDashboardLayout from "@/components/seller/Layout";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <main className="" suppressHydrationWarning>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <SellerDashboardLayout children={children} defaultOpen={defaultOpen} />
      </ThemeProvider>
    </main>
  );
}
// s@FAJADNBB6va9r
