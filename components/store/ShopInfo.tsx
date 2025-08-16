"use client";

import { useSellerStore } from "@/Hooks/use-store-context";
import { cn, countries, splitPhoneNumber } from "@/lib/utils";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { CountryCode, E164Number } from "libphonenumber-js/core";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/Hooks/use-toast";
import { ShopInfoSchema } from "@/lib/form-schema";

// Zod schema for form validation

type Inputs = z.infer<typeof ShopInfoSchema>;

const ShopInfo = () => {
  const { store } = useSellerStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(ShopInfoSchema),
    // Use defaultValues to initialize the form with data from the store
    defaultValues: {
      storeName: store?.name || "",
      country: store?.customerCare?.country || "",
      phoneNumber: store?.contactPhone || "",
      contactName: store?.contact?.name || "",
      contactEmail: store?.contact?.email || "",
      contactPhoneNumber: store?.contact?.phone,
      customerCareName: store?.customerCare?.name || "",
      customerCareEmail: store?.customerCare?.email || "",
      customerCarePhoneNumber: store?.customerCare?.phone || "",
      customerCareAddress1: store?.customerCare?.address1 || "",
      customerCareAddress2: store?.customerCare?.address2 || "",
      state: store?.customerCare?.state || "", // Corrected typo
      city: store?.customerCare?.city || "",
      postalCode: store?.customerCare?.postalCode || "",
    },
  });
  const country = watch("country");
  const sellerCountry = countries.filter((index, i) => index.label === country);
  const router = useRouter();

  // Mutation to create or update store information
  const updateStoreMutation = useMutation({
    mutationFn: async (formData: Inputs) => {
      const res = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create store.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      router.refresh();
      toast({
        title: "Store updated successfully",
        description: "Your store information has been updated.",
        variant: "default",
      });
      console.log("Store updated successfully:", data);
      reset(); // Reset the form after successful submission
    },
    onError: (error: any) => {
      toast({
        title: "Error updating store",
        description:
          error.message || "An error occurred while updating the store.",
        variant: "destructive",
      });
      console.error("Store creation failed:", error.message);
    },
  });

  const processForm: SubmitHandler<Inputs> = (data) => {
    // When submitting, combine the phone number parts back into a single string
    // const submittedData: Inputs = {
    //   ...data,
    //   contactPhoneNumber: splitPhoneNumber(data.contactPhoneNumber).number,
    //   customerCarePhoneNumber: splitPhoneNumber(data.customerCarePhoneNumber)
    //     .number,
    // };
    console.log(data);
    updateStoreMutation.mutate(data);
    // reset();
  };

  return (
    <form onSubmit={handleSubmit(processForm)} className="space-y-12 p-4">
      {/* Account Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium">Account Details</h2>
          <p className="text-sm">Your seller account information.</p>
        </div>

        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5">
          <div className="space-y-2">
            <Label htmlFor="account_email" className="text-sm font-medium">
              Account Email
            </Label>
            <Input
              id="account_email"
              value={store.contactEmail}
              readOnly
              className="read-only:bg-gray-100 dark:read-only:bg-gray-800 text-gray-700 dark:text-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_phone" className="text-sm font-medium">
              Account Phone
            </Label>
            <PhoneInput
              defaultCountry={(sellerCountry[0]?.value as CountryCode) || "NG"}
              placeholder="123-456-7890"
              value={watch("phoneNumber") as E164Number | undefined}
              international
              withCountryCallingCode
              inputComponent={Input}
              onChange={(value: string | undefined) => {
                setValue("phoneNumber", value ?? "");
                // Optionally extract and set country code if needed
              }}
              className="w-full rounded-md p-1 text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country_of_reg" className="text-sm font-medium">
              Country of Registration
            </Label>
            <Input
              id="country_of_reg"
              value={store.country}
              readOnly
              className="read-only:bg-gray-100 dark:read-only:bg-gray-800 text-gray-700 dark:text-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_type" className="text-sm font-medium ">
              Account Type
            </Label>
            <Input
              id="account_type"
              value={store.accountType.toLowerCase()}
              readOnly
              className="read-only:bg-gray-100 dark:read-only:bg-gray-800 text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>
      </div>

      <hr />

      {/* Shop Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium">Shop Details</h2>
          <p className="text-sm">Manage your shop from below</p>
        </div>

        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5">
          <div className="space-y-2">
            <Label htmlFor="storeName" className="text-sm font-medium">
              Shop Name
            </Label>
            <Input
              id="storeName"
              {...register("storeName")}
              className={cn(
                "disabled:bg-gray-100",
                errors.storeName ? "border-red-400" : ""
              )}
            />
            {errors.storeName && (
              <p className="mt-2 text-sm text-red-400">
                {errors.storeName.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <hr />

      {/* Communication Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium">Communication Details</h2>
          <p className="text-sm">
            We'll send communications and contact you on the details below
          </p>
        </div>

        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5 gap-y-7">
          <div className="space-y-2">
            <Label htmlFor="contact_name" className="text-sm font-medium">
              Contact Name
            </Label>
            <Input
              id="contact_name"
              {...register("contactName")}
              placeholder="John Doe"
              className={cn(
                "disabled:bg-gray-100",
                errors.contactName ? "border-red-400" : ""
              )}
            />
            {errors.contactName && (
              <p className="mt-2 text-sm text-red-400">
                {errors.contactName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email" className="text-sm font-medium">
              Contact Email
            </Label>
            <Input
              id="contact_email"
              {...register("contactEmail")}
              placeholder="john@example.com"
              className={cn(
                "disabled:bg-gray-100",
                errors.contactEmail ? "border-red-400" : ""
              )}
            />
            {errors.contactEmail && (
              <p className="mt-2 text-sm text-red-400">
                {errors.contactEmail.message}
              </p>
            )}
          </div>
          <div className="space-y-2 h-full">
            <Label
              htmlFor="contact_phone"
              className="block text-sm font-medium"
            >
              Contact Phone
            </Label>
            <PhoneInput
              defaultCountry={(sellerCountry[0]?.value as CountryCode) || "NG"}
              placeholder="123-456-7890"
              value={watch("contactPhoneNumber") as E164Number | undefined}
              international
              withCountryCallingCode
              inputComponent={Input}
              onChange={(value: string | undefined) => {
                setValue("contactPhoneNumber", value ?? "");
                // Optionally extract and set country code if needed
              }}
              className="rounded-md p-1 text-sm border placeholder:text-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-base"
            />

            {errors.contactPhoneNumber && (
              <p className="mt-2 text-sm text-red-400">
                {errors.contactPhoneNumber?.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <hr />

      {/* Customer Care Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium">Customer Care Details</h2>
          <p className="text-sm">
            Please provide details of your customer support. These details will
            be used to address product issues by customers
          </p>
        </div>

        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5 gap-y-7">
          <div className="space-y-2">
            <Label htmlFor="customer_care_name" className="text-sm font-medium">
              Customer Care Name
            </Label>
            <Input
              id="customer_care_name"
              {...register("customerCareName")}
              placeholder="Center name or representative name"
              className={cn(
                "disabled:bg-gray-100",
                errors.customerCareName ? "border-red-400" : ""
              )}
            />
            {errors.customerCareName && (
              <p className="mt-2 text-sm text-red-400">
                {errors.customerCareName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="customer_care_email"
              className="text-sm font-medium"
            >
              Customer Care Email
            </Label>
            <Input
              id="customer_care_email"
              {...register("customerCareEmail")}
              placeholder="Account email"
              className={cn(
                "disabled:bg-gray-100",
                errors.customerCareEmail ? "border-red-400" : ""
              )}
            />
            {errors.customerCareEmail && (
              <p className="mt-2 text-sm text-red-400">
                {errors.customerCareEmail.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="customer_care_phone_number"
              className="text-sm font-medium"
            >
              Customer Care Phone
            </Label>
            <PhoneInput
              defaultCountry={(sellerCountry[0]?.value as CountryCode) || "NG"}
              placeholder="123-456-7890"
              value={watch("customerCarePhoneNumber") as E164Number | undefined}
              international
              withCountryCallingCode
              inputComponent={Input}
              onChange={(value: string | undefined) => {
                setValue("customerCarePhoneNumber", value ?? "");
                // Optionally extract and set country code if needed
              }}
              className="w-full rounded-md p-1 text-sm border placeholder:text-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-base"
            />

            {errors.customerCarePhoneNumber ? (
              <p className="mt-2 text-sm text-red-400">
                {errors.customerCarePhoneNumber?.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="customer_care_address_1"
              className="text-sm font-medium"
            >
              Address Line 1
            </Label>
            <Input
              id="customer_care_address_1"
              {...register("customerCareAddress1")}
              placeholder="Floor, House/Apartment no., Building"
              className={cn(
                "disabled:bg-gray-100",
                errors.customerCareAddress1 ? "border-red-400" : ""
              )}
            />
            {errors.customerCareAddress1 && (
              <p className="mt-2 text-sm text-red-400">
                {errors.customerCareAddress1.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="customer_care_address_2"
              className="text-sm font-medium capitalize"
            >
              Address line 2
            </Label>
            <Input
              id="customer_care_address_2"
              {...register("customerCareAddress2")}
              placeholder="Street, Area, Locality"
              className={cn(
                "disabled:bg-gray-100",
                errors.customerCareAddress2 ? "border-red-400" : ""
              )}
            />
            {errors.customerCareAddress2 && (
              <p className="mt-2 text-sm text-red-400">
                {errors.customerCareAddress2.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="customer_care_city"
              className="text-sm font-medium capitalize"
            >
              City / town
            </Label>
            <Input
              id="customer_care_city"
              {...register("city")}
              placeholder="City or town"
              className={cn(
                "disabled:bg-gray-100",
                errors.city ? "border-red-400" : ""
              )}
            />
            {errors.city && (
              <p className="mt-2 text-sm text-red-400">{errors.city.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium capitalize">
              State / province
            </Label>
            <Input
              id="state"
              {...register("state")}
              placeholder="State or province"
              className={cn(
                "disabled:bg-gray-100",
                errors.state ? "border-red-400" : ""
              )}
            />
            {errors.state && (
              <p className="mt-2 text-sm text-red-400">
                {errors.state.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="postal_code"
              className="text-sm font-medium capitalize"
            >
              Zip / postal code
            </Label>
            <Input
              id="postal_code"
              {...register("postalCode")}
              placeholder="Postal code"
              className={cn(
                "disabled:bg-gray-100",
                errors.postalCode ? "border-red-400" : ""
              )}
            />
            {errors.postalCode && (
              <p className="mt-2 text-sm text-red-400">
                {errors.postalCode.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium capitalize">
              Country
            </Label>
            <Select
              value={watch("country")}
              onValueChange={(value) => setValue("country", value)}
            >
              <SelectTrigger
                className={cn("w-full", errors.country ? "border-red-400" : "")}
              >
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="mt-2 text-sm text-red-400">
                {errors.country.message}
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

export default ShopInfo;
