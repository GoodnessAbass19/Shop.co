import Menu from "@/components/layout/menu";
import { UserProvider } from "@/Hooks/user-context";
import { User } from "lucide-react";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="">
      <UserProvider>
        <Menu />
        {children}
      </UserProvider>
    </div>
  );
}
// s@FAJADNBB6va9r
