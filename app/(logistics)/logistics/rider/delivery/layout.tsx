import { ThemeProvider } from "@/components/layout/theme-provider";
import RiderDashboardLayout from "@/components/rider/Layout";

export default async function RiderDeliveryLayout({
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
        {/* <RiderDashboardLayout>{children}</RiderDashboardLayout> */}
        {children}
      </ThemeProvider>
    </main>
  );
}
