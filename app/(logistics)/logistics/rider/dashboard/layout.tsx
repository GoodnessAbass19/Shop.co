import RiderNavbar from "@/components/dashboard/rider-navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import RiderDashboardLayout from "@/components/rider/Layout";
import { cookies } from "next/headers";

export default async function RiderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();

  return (
    <main className="" suppressHydrationWarning>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <RiderDashboardLayout>{children}</RiderDashboardLayout>
      </ThemeProvider>
    </main>
  );
}
// s@FAJADNBB6va9r
