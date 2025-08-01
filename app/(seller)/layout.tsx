import { ThemeProvider } from "@/components/layout/theme-provider";
import SellerDashboardLayout from "@/components/seller/Layout";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="" suppressHydrationWarning>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <SellerDashboardLayout children={children} />
      </ThemeProvider>
    </main>
  );
}
// s@FAJADNBB6va9r
