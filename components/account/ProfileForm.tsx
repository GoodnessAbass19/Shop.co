// components/user/ProfileForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui Input
import { Label } from "@/components/ui/label"; // Assuming shadcn/ui Label
import { Loader2, User, Phone, Image as ImageIcon } from "lucide-react"; // Icons
import { useToast } from "@/Hooks/use-toast"; // Your custom useToast hook
import { ToastAction } from "@/components/ui/toast"; // ToastAction component

// Define a type for your user object for better type safety
interface UserProfile {
  id: string; // Assuming user has an ID
  name: string | null;
  email: string | null; // Assuming email is a core part of user profile
  phone: string | null;
  createdAt: string | number | Date;
  //   avatar: string | null;
  // Add other user fields you want to display/edit
}

interface ProfileFormProps {
  user: UserProfile; // Expecting a UserProfile object
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    // avatar: user.avatar || "", // Assuming 'avatar' is the field for profile picture URL
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (dataToUpdate: Partial<UserProfile>) => {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToUpdate),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] }); // Invalidate current user data
      queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] }); // Invalidate profile by ID

      toast({
        title: "Profile Updated!",
        description: "Your profile information has been successfully saved.",
        action: <ToastAction altText="View Profile">Dismiss</ToastAction>,
      });
      // Consider router.refresh() if you expect server component re-rendering
      // router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="bg-white py-5">
      <div className="p-4 border rounded-xl border-gray-200 space-y-5">
        <h3 className="text-xl font-semibold text-gray-900 capitalize mb-4">
          about you
        </h3>

        {/* <div>
          <p className="text-sm text-gray-500 mb-2">
            Update your profile information below. Fields marked with an
            asterisk (*) are required.
          </p>
          <p className="text-sm text-gray-500">
            Your email is used for account recovery and notifications.
          </p>
        </div> */}

        <div className="flex flex-col gap-2.5 justify-start items-start font-sans">
          <span className="capitalize font-semibold text-lg">name</span>
          {user?.name}
        </div>
        <div className="flex flex-col gap-2.5 justify-start items-start font-sans">
          <span className="capitalize font-semibold text-lg">member since</span>
          {new Date(user?.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded-xl border-gray-200 space-y-5 mt-5"
      >
        <h3 className="text-xl font-semibold text-gray-900 capitalize mb-4">
          update profile
        </h3>
        <div className="max-w-md space-y-5">
          {/* Name Input */}
          <div>
            <Label
              htmlFor="name"
              className="block text-sm font-semibold capitalize text-gray-700 mb-1"
            >
              Name
            </Label>
            <div className="relative flex items-center">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                disabled={updateProfileMutation.isPending}
              />
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <Label
              htmlFor="phone"
              className="block text-sm font-semibold capitalize text-gray-700 mb-1"
            >
              Phone Number
            </Label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., +1 (555) 123-4567"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                disabled={updateProfileMutation.isPending}
              />
            </div>
          </div>

          {/* Avatar URL Input */}
          {/* <div>
          <Label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</Label>
          <div className="relative flex items-center">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="avatar"
              name="avatar"
              type="url"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://example.com/your-avatar.jpg"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              disabled={updateProfileMutation.isPending}
            />
          </div>
        </div> */}

          {/* Submit Button */}
          <Button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" /> Saving...
              </>
            ) : (
              "Update Profile"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
