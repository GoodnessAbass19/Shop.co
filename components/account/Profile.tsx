// app/profile/page.tsx (Example)
"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have Button
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

// Define a type that matches what your API fetches for the current user
interface FetchedUser {
  id: string;
  name: string | null;
  email: string; // Assuming email is always present
  phone: string | null;
  createdAt: string | number | Date;
  //   avatar: string | null;
  // Add other fields you fetch
}

// Function to fetch current user data
async function fetchCurrentUser(): Promise<FetchedUser> {
  const res = await fetch("/api/me"); // Assuming a GET route for fetching profile
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch user profile.");
  }
  return res.json().then((data) => data.user); // Assuming API returns { user: ... }
}

export default function ProfilePage() {
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<FetchedUser, Error>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 10 * 60 * 1000, // Data considered fresh for 5 minutes
  });

  if (isLoading) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  //   if (isError) {
  //     return (
  //       <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-red-50 p-8 text-center rounded-lg shadow-lg">
  //         <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
  //         <p className="text-xl font-semibold mb-3">Error loading profile:</p>
  //         <p className="mb-4">{error?.message || "An unknown error occurred."}</p>
  //         <Button
  //           onClick={() => refetch()}
  //           className="bg-red-700 hover:bg-red-800 text-white"
  //         >
  //           Retry
  //         </Button>
  //       </div>
  //     );
  //   }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-white">
        <p className="text-xl font-medium">User profile not found.</p>
        {/* Maybe redirect to login if user object is unexpectedly null */}
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}
