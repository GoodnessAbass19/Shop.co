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
import { toast } from "@/hooks/use-toast";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSellerStore } from "@/hooks/use-store-context";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BusinessInfoSchema } from "@/lib/form-schema";
import { z } from "zod";
import { Button } from "../ui/button";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Inputs = z.infer<typeof BusinessInfoSchema>;

const BusinessInfo = () => {
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
      idNumber: store?.businessInfo?.idNumber || "",
    },
  });

  const handleFileUpload = async (files: File[], field: keyof Inputs) => {
    if (!files.length) return;
    try {
      const result = await uploadToCloudinary(files[0]);
      // Assuming result.url is the uploaded file URL
      setValue(field, result);
      toast({
        title: "Upload successful",
        description: "File uploaded successfully.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const idType = watch("idType");
  const frontImage = watch("idImageFront");
  const backImage = watch("idImageBack");
  const taxImage = watch("taxIdImage");

  // For ID Front
  const { getRootProps: getFrontRootProps, getInputProps: getFrontInputProps } =
    useDropzone({
      accept: {
        "image/jpeg": [],
        "image/png": [],
        "application/pdf": [],
        "image/jpg": [],
      },
      multiple: false,
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024,
      onDrop: (acceptedFiles) =>
        handleFileUpload(acceptedFiles, "idImageFront"),
      onDropRejected: (fileRejections) => {
        /* ...existing toast... */
      },
    });

  // For ID Back
  const { getRootProps: getBackRootProps, getInputProps: getBackInputProps } =
    useDropzone({
      accept: {
        "image/jpeg": [],
        "image/png": [],
        "application/pdf": [],
        "image/jpg": [],
      },
      multiple: false,
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024,
      onDrop: (acceptedFiles) => handleFileUpload(acceptedFiles, "idImageBack"),
      onDropRejected: (fileRejections) => {
        /* ...existing toast... */
      },
    });

  // For Tax ID Image
  const { getRootProps: getTaxRootProps, getInputProps: getTaxInputProps } =
    useDropzone({
      accept: {
        "image/jpeg": [],
        "image/png": [],
        "application/pdf": [],
        "image/jpg": [],
      },
      multiple: false,
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024,
      onDrop: (acceptedFiles) => handleFileUpload(acceptedFiles, "taxIdImage"),
      onDropRejected: (fileRejections) => {
        /* ...existing toast... */
      },
    });

  // Mutation to create or update store information
  const updateStoreMutation = useMutation({
    mutationFn: async (formData: Inputs) => {
      const res = await fetch("/api/store/businessInfo", {
        method: store.businessInfo?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update business info.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      router.refresh();
      toast({
        title: "Business info updated successfully",
        description: "Your business information has been updated.",
        variant: "default",
      });
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
    updateStoreMutation.mutate(data);
    // reset();
  };

  return (
    <form onSubmit={handleSubmit(processForm)} className="space-y-12 p-4">
      {/* Legal Representative Details */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium capitalize">
            legal representative details
          </h2>
          <p className="text-base font-sans">
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
              value={watch("idType") || ""}
              onValueChange={(value) =>
                setValue("idType", value as Inputs["idType"])
              }
            >
              <SelectTrigger
                className={cn("w-full", errors.idType ? "border-red-400" : "")}
                id="id_type"
                aria-invalid={!!errors.idType}
                aria-describedby={errors.idType ? "idType-error" : undefined}
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
              <p id="idType-error" className="mt-2 text-sm text-red-400">
                {errors.idType.message}
              </p>
            )}
          </div>
        </div>

        {idType && (
          <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-start gap-5 gap-y-7 ease-linear transition-all">
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
                {...register("idNumber")}
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
                <div>
                  <div className="border-2 border-gray-300 rounded-md p-1.5 text-center cursor-pointer flex justify-between items-center">
                    <div
                      aria-disabled
                      className="flex-1 text-start text-sm text-gray-500 line-clamp-1 overflow-hidden"
                    >
                      {frontImage ? `${frontImage}` : "Frontside"}
                    </div>
                    {/* // ID Front */}
                    <div {...getFrontRootProps()}>
                      <Input {...getFrontInputProps()} />
                      <Paperclip className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  {frontImage && (
                    <Link
                      href={frontImage}
                      target="_blank"
                      className="text-blue-300 hover:underline text-xs font-light capitalize"
                    >
                      view file
                    </Link>
                  )}
                </div>
                <div>
                  <div className="border-2 border-gray-300 rounded-md p-1.5 text-center cursor-pointer flex justify-between items-center ">
                    <div
                      aria-disabled
                      className="flex-1 text-start text-sm text-gray-500 line-clamp-1 overflow-hidden"
                    >
                      {backImage ? `${backImage}` : "Backside"}
                    </div>
                    {/* // ID Back */}
                    <div {...getBackRootProps()}>
                      <Input {...getBackInputProps()} />
                      <Paperclip className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  {backImage && (
                    <Link
                      href={backImage}
                      target="_blank"
                      className="text-blue-300 hover:underline text-xs font-light capitalize"
                    >
                      view file
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-start gap-5 gap-y-7">
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
              {...register("taxIdentificationNumber")}
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
            <div>
              <div className="border-2 border-gray-300 rounded-md p-1.5 text-center cursor-pointer flex justify-between items-center">
                <div
                  aria-disabled
                  className="flex-1  text-start text-sm text-gray-500 line-clamp-1 overflow-hidden"
                >
                  {taxImage ? `${taxImage}` : "Upload .jpeg, .jpg, .png, .pdf"}
                </div>
                <div {...getTaxRootProps()}>
                  <Input {...getTaxInputProps()} />
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              {taxImage && (
                <Link
                  href={taxImage}
                  target="_blank"
                  className="text-blue-300 hover:underline text-xs font-light capitalize"
                >
                  view file
                </Link>
              )}
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
              {...register("vatNumber")}
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
          <p className="text-base font-sans">
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
              Address line 2{/* <span className="text-xs">Required</span> */}
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
                "read-only:bg-gray-100 dark:read-only:bg-gray-800 text-gray-700 dark:text-gray-300",
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
