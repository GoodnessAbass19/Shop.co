"use client";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Switch } from "../ui/switch";
import { useSellerStore } from "@/Hooks/use-store-context";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShippingInfoSchema } from "@/lib/form-schema";
import { z } from "zod";
import { Button } from "../ui/button";
import { toast } from "@/Hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

type Inputs = z.infer<typeof ShippingInfoSchema>;

const ShippingInfo = () => {
  const { store } = useSellerStore();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(ShippingInfoSchema),
    // Use defaultValues to initialize the form with data from the store
    defaultValues: {
      shippingZone: store.state,
      shippingAddress1: store.shippingInfo?.shippingAddress1 || "",
      shippingAddress2: store.shippingInfo?.shippingAddress2 || "",
      shippingCity: store.shippingInfo?.shippingCity || "",
      shippingState: store.shippingInfo?.shippingState || "",
      shippingCountry: store?.country || "",
      shippingPostalCode: store?.shippingInfo?.shippingPostalCode || "",
      returnAddress1: store?.shippingInfo?.returnAddress1 || "",
      returnAddress2: store?.shippingInfo?.returnAddress2 || "",
      returnCity: store?.shippingInfo?.returnCity || "",
      returnCountry: store?.country || "",
      returnPostalCode: store?.shippingInfo?.returnPostalCode || "",
      returnState: store?.shippingInfo?.returnState || "",
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async (formData: Inputs) => {
      const res = await fetch("/api/store/businessInfo", {
        method: store.businessInfo?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update shipping info.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      router.refresh();
      toast({
        title: "Shipping info updated successfully",
        description: "Your shipping information has been updated.",
        variant: "default",
      });
      reset(); // Reset the form after successful submission
    },
    onError: (error: any) => {
      toast({
        title: "Error updating information",
        description:
          error.message ||
          "An error occurred while updating your shipping info.",
        variant: "destructive",
      });
      console.error("Store creation failed:", error.message);
    },
  });

  const processForm: SubmitHandler<Inputs> = (data) => {
    updateStoreMutation.mutate(data);
    // reset();
  };

  return (
    <form onSubmit={handleSubmit(processForm)} className="space-y-12 p-4">
      {/* Shipping Zone */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium capitalize">
            shipping information
          </h2>
          <p className="text-base font-sans">
            Please choose your preferred method of communucation and your
            shipping address
          </p>
        </div>

        <div className="grid md:grid-cols-3">
          <div className="space-y-2">
            <Label
              htmlFor="shippingZone"
              className="text-sm font-medium flex items-center justify-between"
            >
              Shipping Zone
              <span className="text-xs">Required</span>
            </Label>
            <Input
              id="shippingZone"
              type="text"
              readOnly
              {...register("shippingZone")}
              className={cn(
                "read-only:bg-gray-100 dark:read-only:bg-gray-800 text-gray-700 dark:text-gray-300",
                errors.shippingZone ? "border-red-400" : ""
              )}
            />
          </div>
        </div>
      </div>

      <hr />

      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium capitalize">
            shipping information
          </h2>
          <p className="text-base font-sans">
            Please provide the address from where you prefer to ship your
            products
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="business-address" />
          <Label htmlFor="business-address">
            {" "}
            Make it same as your business address
          </Label>
        </div>
        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5">
          <div className="space-y-2">
            <Label
              htmlFor="shippingAddress1"
              className="text-sm font-medium flex items-center justify-between"
            >
              Address Line 1<span className="text-xs">Required</span>
            </Label>

            <Input
              id="shippingAddress1"
              {...register("shippingAddress1")}
              placeholder="Floor, House/Apartment no., Building"
              className={cn(
                "disabled:bg-gray-100",
                errors.shippingAddress1 ? "border-red-400" : ""
              )}
            />
            {errors.shippingAddress1 && (
              <p className="mt-2 text-sm text-red-400">
                {errors.shippingAddress1.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="shippingAddress2"
              className="text-sm font-medium flex items-center justify-between"
            >
              Address Line 2
            </Label>

            <Input
              id="shippingAddress2"
              {...register("shippingAddress2")}
              placeholder="Block/Street, name"
              className={cn(
                "disabled:bg-gray-100",
                errors.shippingAddress2 ? "border-red-400" : ""
              )}
            />
            {errors.shippingAddress2 && (
              <p className="mt-2 text-sm text-red-400">
                {errors.shippingAddress2.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="city"
              className="text-sm font-medium flex items-center justify-between"
            >
              City/Town<span className="text-xs">Required</span>
            </Label>

            <Input
              id="city"
              placeholder="Province/town"
              {...register("shippingCity")}
              className={cn(
                "disabled:bg-gray-100",
                errors.shippingCity ? "border-red-400" : ""
              )}
            />
            {errors.shippingCity && (
              <p className="mt-2 text-sm text-red-400">
                {errors.shippingCity.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="state"
              className="text-sm font-medium flex items-center justify-between"
            >
              State/Province<span className="text-xs">Required</span>
            </Label>

            <Input
              id="state"
              placeholder="state"
              {...register("shippingState")}
              className={cn(
                "disabled:bg-gray-100",
                errors.shippingState ? "border-red-400" : ""
              )}
            />
            {errors.shippingState && (
              <p className="mt-2 text-sm text-red-400">
                {errors.shippingState.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="country"
              className="text-sm font-medium flex items-center justify-between"
            >
              Country<span className="text-xs">Required</span>
            </Label>

            <Input
              id="country"
              placeholder="country"
              {...register("shippingCountry")}
              readOnly
              className={cn(
                "read-only:bg-gray-100 dark:read-only:bg-gray-800 text-gray-700 dark:text-gray-300",
                errors.shippingCountry ? "border-red-400" : ""
              )}
            />
            {errors.shippingCountry && (
              <p className="mt-2 text-sm text-red-400">
                {errors.shippingCountry.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="postal-code"
              className="text-sm font-medium flex items-center justify-between"
            >
              Country<span className="text-xs">Required</span>
            </Label>

            <Input
              id="postal-code"
              placeholder="Postal Code"
              {...register("shippingPostalCode")}
              className={cn(
                "disabled:bg-gray-100",
                errors.shippingPostalCode ? "border-red-400" : ""
              )}
            />
            {errors.shippingPostalCode && (
              <p className="mt-2 text-sm text-red-400">
                {errors.shippingPostalCode.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <hr />

      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium capitalize">return address</h2>
          <p className="text-base font-sans">
            Please provide the return address
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="return-address" />
          <Label htmlFor="return-address">
            Make it same as your business address
          </Label>
        </div>

        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5">
          <div className="space-y-2">
            <Label
              htmlFor="returnAddress1"
              className="text-sm font-medium flex items-center justify-between"
            >
              Address Line 1<span className="text-xs">Required</span>
            </Label>

            <Input
              id="returnAddress1"
              placeholder="Floor, House/Apartment no., Building"
              {...register("returnAddress1")}
              className={cn(
                "disabled:bg-gray-100",
                errors.returnAddress1 ? "border-red-400" : ""
              )}
            />
            {errors.returnAddress1 && (
              <p className="mt-2 text-sm text-red-400">
                {errors.returnAddress1.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="returnAddress2"
              className="text-sm font-medium flex items-center justify-between"
            >
              Address Line 2
            </Label>

            <Input
              id="returnAddress2"
              placeholder="Block/Street, name"
              {...register("returnAddress2")}
              className={cn(
                "disabled:bg-gray-100",
                errors.returnAddress2 ? "border-red-400" : ""
              )}
            />
            {errors.returnAddress2 && (
              <p className="mt-2 text-sm text-red-400">
                {errors.returnAddress2.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="returnCity"
              className="text-sm font-medium flex items-center justify-between"
            >
              City/Town<span className="text-xs">Required</span>
            </Label>

            <Input
              id="returnCity"
              placeholder="Province/town"
              {...register("returnCity")}
              className={cn(
                "disabled:bg-gray-100",
                errors.returnCity ? "border-red-400" : ""
              )}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="returnState"
              className="text-sm font-medium flex items-center justify-between"
            >
              State/Province<span className="text-xs">Required</span>
            </Label>

            <Input
              id="returnState"
              placeholder="state"
              {...register("returnState")}
              className={cn(
                "disabled:bg-gray-100",
                errors.returnState ? "border-red-400" : ""
              )}
            />
            {errors.returnState && (
              <p className="mt-2 text-sm text-red-400">
                {errors.returnState.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="returnCountry"
              className="text-sm font-medium flex items-center justify-between"
            >
              Country<span className="text-xs">Required</span>
            </Label>

            <Input
              id="returnCountry"
              placeholder="country"
              {...register("returnCountry")}
              readOnly
              className={cn(
                "read-only:bg-gray-100 dark:read-only:bg-gray-800 text-gray-700 dark:text-gray-300",
                errors.returnCountry ? "border-red-400" : ""
              )}
            />
            {errors.returnCountry && (
              <p className="mt-2 text-sm text-red-400">
                {errors.returnCountry.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="return-postal-code"
              className="text-sm font-medium flex items-center justify-between"
            >
              Country<span className="text-xs">Required</span>
            </Label>

            <Input
              id="return-postal-code"
              placeholder="Postal Code"
              {...register("returnPostalCode")}
              className={cn(
                "disabled:bg-gray-100",
                errors.returnPostalCode ? "border-red-400" : ""
              )}
            />
            {errors.returnPostalCode && (
              <p className="mt-2 text-sm text-red-400">
                {errors.returnPostalCode.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end items-end w-full">
        <Button
          type="submit"
          className="bg-blue-500 px-3 py-2 rounded-lg text-white capitalize w-24"
        >
          save
        </Button>
      </div>
    </form>
  );
};

export default ShippingInfo;
