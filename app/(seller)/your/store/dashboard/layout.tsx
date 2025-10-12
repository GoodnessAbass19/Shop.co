import { ThemeProvider } from "@/components/layout/theme-provider";
import SellerDashboardLayout from "@/components/seller/Layout";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const storeToken = cookieStore.get("store-token")?.value;

  return (
    <main className="" suppressHydrationWarning>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <SellerDashboardLayout
          children={children}
          defaultOpen={defaultOpen}
          storeToken={storeToken}
        />
      </ThemeProvider>
    </main>
  );
}
// s@FAJADNBB6va9r
