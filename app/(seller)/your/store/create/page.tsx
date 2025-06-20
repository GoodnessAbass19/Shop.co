// app/seller/create-store/page.tsx
// This page should ideally be protected by your authentication middleware.

import MultiStepStoreForm from "@/components/store/multi-step-form";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

// Removed direct prisma import here for cleaner server component if not doing SSR data fetching
// import prisma from '@/lib/prisma'; // Only if you uncomment server-side store check

// import { getCurrentUser } from '@/lib/auth'; // Only if you uncomment server-side store check

export default async function CreateStorePage() {
  // Optional: Server-side check if user already has a store
  // You might want to redirect them if they already have one.
  // This part would need 'use client' if it involved useRouter.
  // For now, leaving it as a placeholder. If you implement this, ensure
  // you import prisma and getCurrentUser, and consider using 'redirect' from 'next/navigation'
  // which is only available in Server Components.

  const user = await getCurrentUser();
  let userHasStore = false;
  if (user) {
    const store = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (store) {
      userHasStore = true;
      redirect("/your/store/dashboard"); // Use redirect for server components
    }
  }

  return (
    <div className="min-h-screen max-w-screen-xl mx-auto py-10 flex items-start justify-start">
      {/*
        {userHasStore ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">You already have a store!</h2>
            <p className="text-gray-700 mb-6">You can manage your existing store from your dashboard.</p>
            <a href="/seller/dashboard" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
            </a>
          </div>
        ) : (
          <MultiStepStoreCreationForm />
        )}
      */}
      <MultiStepStoreForm />
    </div>
  );
}
