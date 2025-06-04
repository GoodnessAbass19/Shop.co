"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "GET" });
    router.push("/"); // Redirect to login or home
  };

  return (
    <button
      onClick={handleLogout}
      className="flex justify-between items-center text-base gap-2 text-black rounded hover:text-red-600 capitalize"
    >
      <LogOut className="rotate-180 w-5 h-5" /> sign out
    </button>
  );
}
