"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "GET" });
    // Refresh the page to update the UI
    localStorage.removeItem("token"); // Clear token from local storage if used
    router.push("/"); // Redirect to login or home
    router.refresh();
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
