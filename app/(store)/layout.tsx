import Menu from "@/components/layout/menu";
import { UserProvider } from "@/hooks/user-context";
import { User } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = await cookieStore.get("token")?.value;

  return (
    <div className="">
      <UserProvider token={token!}>
        <Menu />
        {children}
      </UserProvider>
    </div>
  );
}
// s@FAJADNBB6va9r
