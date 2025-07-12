import SellerDashboardLayout from "@/components/seller/Layout";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="">
      <SellerDashboardLayout children={children} />
    </main>
  );
}
// s@FAJADNBB6va9r
