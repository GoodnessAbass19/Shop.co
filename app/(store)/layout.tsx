import Menu from "@/components/layout/menu";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="">
      <Menu />
      {children}
    </div>
  );
}
// s@FAJADNBB6va9r
