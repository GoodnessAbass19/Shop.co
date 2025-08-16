"use client";

import { useDropzone } from "react-dropzone";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "@/Hooks/use-toast";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSellerStore } from "@/Hooks/use-store-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BusinessInfoSchema } from "@/lib/form-schema";
import { z } from "zod";
import { Button } from "../ui/button";

type Inputs = z.infer<typeof BusinessInfoSchema>;

const BusinessInfo = () => {
  const { store } = useSellerStore();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(BusinessInfoSchema),
    // Use defaultValues to initialize the form with data from the store
    defaultValues: {
      representativeName: store?.businessInfo?.fullName || "",
      idType: store?.businessInfo?.idType ?? undefined,
      idImageFront: store?.businessInfo?.idImageFront,
      idImageBack: store?.businessInfo?.idImageBack,
      taxIdentificationNumber: store?.businessInfo?.taxId || "",
      taxIdImage: store?.businessInfo?.taxIdImage,
      vatNumber: store?.businessInfo?.vatNumber || "",
      address1: store?.businessInfo?.address1 || "",
      address2: store?.businessInfo?.address2 || "",
      city: store?.businessInfo?.city || "",
      state: store?.businessInfo?.state || "",
      postalCode: store?.businessInfo?.postalCode || "",
      country: store?.country || "NIGERIA", // Default to Nigeria
    },
  });

  const idType = watch("idType");

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } =
    useDropzone({
      accept: {
        "image/jpeg": [],
        "image/png": [],
        "application/pdf": [],
        "image/jpg": [],
      },
      multiple: false,
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024, // 5MB per file
      onDropRejected: (fileRejections: any[]) => {
        toast({
          title: "Image Files Rejected",
          description: fileRejections
            .map((r) =>
              r.errors.map((e: { message: any }) => e.message).join(", ")
            )
            .join("; "),
          variant: "destructive",
        });
      },
    });

  return (
    <form className="space-y-12 p-4">
      {/* Legal Representative Details */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium capitalize">
            legal representative details
          </h2>
          <p className="text-sm">
            Please provide the following details of the owner / legal
            representative of your business
          </p>
        </div>
        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5 gap-y-7">
          <div className="space-y-2">
            <Label
              htmlFor="legal_name"
              className="text-sm font-medium flex items-center justify-between"
            >
              Full Name
              <span className="text-xs">Required</span>
            </Label>
            <Input
              type="text"
              id="legal_name"
              {...register("representativeName")}
              placeholder="Name as on the ID"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.representativeName && (
              <p className="mt-2 text-sm text-red-400">
                {errors.representativeName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="id_type"
              className="text-sm font-medium flex items-center justify-between"
            >
              Choose ID Type
              <span className="text-xs">Required</span>
            </Label>
            <Select
              value={watch("idType")}
              onValueChange={(value) =>
                setValue("idType", value as Inputs["idType"])
              }
            >
              <SelectTrigger
                className={cn("w-full", errors.country ? "border-red-400" : "")}
              >
                <SelectValue placeholder="Select ID Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PASSPORT">Passport</SelectItem>
                <SelectItem value="VOTER_ID">Voter ID</SelectItem>
                <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                <SelectItem value="DRIVER_LICENSE">Driving License</SelectItem>
              </SelectContent>
            </Select>
            {errors.idType && (
              <p className="mt-2 text-sm text-red-400">
                {errors.idType.message}
              </p>
            )}
          </div>
        </div>

        {idType && (
          <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5 gap-y-7 ease-linear transition-all">
            <div className="space-y-2">
              <Label
                htmlFor="idNumber"
                className="text-sm font-medium flex items-center justify-between capitalize"
              >
                {idType
                  .toLowerCase()
                  .split("_")
                  .map((word) => word.trim())
                  .join(" ")}{" "}
                Number
                <span className="text-xs">Required</span>
              </Label>
              <Input
                type="text"
                id="idNumber"
                placeholder="ID Number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="idImageFront"
                className="text-sm font-medium flex items-center justify-between capitalize"
              >
                upload{" "}
                {idType
                  .toLowerCase()
                  .split("_")
                  .map((word) => word.trim())
                  .join(" ")}{" "}
                Card
                <span className="text-xs">Required</span>
              </Label>
              <div className="grid md:grid-cols-2 justify-between items-center gap-5">
                <div className="border-2 border-gray-300 rounded-md p-1.5 text-center cursor-pointer flex justify-between items-center">
                  <div
                    // // readOnly
                    // placeholder="upload .jpeg, .jpg, .png, .pdf"
                    className="flex-1 text-muted text-start"
                  >
                    <p className="text-sm text-gray-500">Frontside</p>
                  </div>
                  <div
                    {...getImageRootProps({
                      className: "",
                    })}
                  >
                    <Input {...getImageInputProps()} />
                    <Paperclip className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <div className="border-2 border-gray-300 rounded-md p-1.5 text-center cursor-pointer flex justify-between items-center">
                  <div
                    // // readOnly
                    // placeholder="upload .jpeg, .jpg, .png, .pdf"
                    className="flex-1 text-muted text-start"
                  >
                    <p className="text-sm text-gray-500">Backside</p>
                  </div>
                  <div
                    {...getImageRootProps({
                      className: "",
                    })}
                  >
                    <Input {...getImageInputProps()} />
                    <Paperclip className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5 gap-y-7">
          <div className="space-y-2">
            <Label
              htmlFor="taxId"
              className="text-sm font-medium flex items-center justify-between"
            >
              Tax Identification Number (TIN)
              <span className="text-xs">Required</span>
            </Label>
            <Input
              type="text"
              id="taxId"
              placeholder="Tax Identification Number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder:capitalize"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="taxIdImage"
              className="text-sm font-medium flex items-center justify-between"
            >
              Upload Tax Identification Number (TIN)
              <span className="text-xs">Required</span>
            </Label>
            <div className="border-2 border-gray-300 rounded-md p-1.5 text-center cursor-pointer flex justify-between items-center">
              <div
                // // readOnly
                // placeholder="upload .jpeg, .jpg, .png, .pdf"
                className="flex-1 text-muted text-start"
              >
                <p className="text-sm text-gray-500">
                  Upload .jpeg, .jpg, .png, .pdf
                </p>
              </div>
              <div
                {...getImageRootProps({
                  className: "",
                })}
              >
                <Input {...getImageInputProps()} />
                <Paperclip className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="vatNumber"
              className="text-sm font-medium flex items-center justify-between"
            >
              VAT Number
              <span className="text-xs">Required</span>
            </Label>
            <Input
              type="text"
              id="vatNumber"
              placeholder="VAT Number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder:capitalize"
            />
          </div>
        </div>
      </div>

      <hr />

      {/* Legal Representative Address */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium capitalize">
            legal representative address
          </h2>
          <p className="text-sm">
            Please provide the registered address of your business
          </p>
        </div>

        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5">
          <div className="space-y-2">
            <Label
              htmlFor="address_1"
              className="text-sm font-medium flex items-center justify-between"
            >
              Address Line 1<span className="text-xs">Required</span>
            </Label>
            <Input
              id="address_1"
              {...register("address1")}
              placeholder="Floor, House/Apartment no., Building"
              className={cn(
                "disabled:bg-gray-100",
                errors.address1 ? "border-red-400" : ""
              )}
            />
            {errors.address1 && (
              <p className="mt-2 text-sm text-red-400">
                {errors.address1.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="address_2"
              className="text-sm font-medium capitalize flex items-center justify-between"
            >
              Address line 2<span className="text-xs">Required</span>
            </Label>
            <Input
              id="address_2"
              {...register("address2")}
              placeholder="Street, Area, Locality"
              className={cn(
                "disabled:bg-gray-100",
                errors.address2 ? "border-red-400" : ""
              )}
            />
            {errors.address2 && (
              <p className="mt-2 text-sm text-red-400">
                {errors.address2.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="customer_care_city"
              className="text-sm font-medium capitalize flex items-center justify-between"
            >
              City / town
              <span className="text-xs">Required</span>
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
            <Label
              htmlFor="state"
              className="text-sm font-medium capitalize flex items-center justify-between"
            >
              State / province
              <span className="text-xs">Required</span>
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
              htmlFor="country"
              className="text-sm font-medium capitalize flex items-center justify-between"
            >
              Country
              <span className="text-xs">Required</span>
            </Label>

            <Input
              id="country"
              {...register("country")}
              placeholder="country"
              readOnly
              className={cn(
                "disabled:bg-gray-100 read-only:bg-gray-100 dark:read-only:bg-gray-800 text-gray-700 dark",
                errors.country ? "border-red-400" : ""
              )}
            />
            {errors.country && (
              <p className="mt-2 text-sm text-red-400">
                {errors.country.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="postal_code"
              className="text-sm font-medium capitalize flex items-center justify-between"
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

export default BusinessInfo;
