// components/store/StoreDetailsStep.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, UploadCloud, Trash2, Image as ImageIcon } from "lucide-react";
import {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/Hooks/use-toast";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface StoreFormData {
  name: string;
  description?: string;
  logo: string;
  banners: string[];
  products: any[];
}

interface StoreDetailsStepProps {
  register: UseFormRegister<StoreFormData>;
  setValue: UseFormSetValue<StoreFormData>;
  watch: UseFormWatch<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
}

export function StoreDetailsStep({
  register,
  setValue,
  watch,
  errors,
}: StoreDetailsStepProps) {
  const { toast } = useToast();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanners, setUploadingBanners] = useState(false);

  const currentLogo = watch("logo");
  const currentBanners = watch("banners") || [];

  const onDropLogo = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      setUploadingLogo(true);
      try {
        const url = await uploadToCloudinary(acceptedFiles[0]);
        setValue("logo", url, { shouldValidate: true });
        toast({ title: "Logo Uploaded", description: "Store logo updated." });
      } catch (e: any) {
        toast({
          title: "Upload Error",
          description: e.message || "Logo upload failed.",
          variant: "destructive",
        });
      } finally {
        setUploadingLogo(false);
      }
    },
    [setValue, toast]
  );

  const onDropBanners = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      setUploadingBanners(true);
      try {
        const urls = await Promise.all(acceptedFiles.map(uploadToCloudinary));
        const updated = [...currentBanners, ...urls];
        setValue("banners", updated, { shouldValidate: true });
        toast({
          title: "Banners Uploaded",
          description: `${urls.length} banner(s) added.`,
        });
      } catch (e: any) {
        toast({
          title: "Upload Error",
          description: e.message || "Banner upload failed.",
          variant: "destructive",
        });
      } finally {
        setUploadingBanners(false);
      }
    },
    [setValue, currentBanners, toast]
  );

  const removeBanner = (index: number) => {
    const updated = currentBanners.filter((_, i) => i !== index);
    setValue("banners", updated, { shouldValidate: true });
    toast({ title: "Banner Removed", description: "Banner removed." });
  };

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps } =
    useDropzone({
      onDrop: onDropLogo,
      accept: { "image/jpeg": [], "image/png": [], "image/jpg": [] },
      maxSize: 5 * 1024 * 1024,
      multiple: false,
    });

  const {
    getRootProps: getBannerRootProps,
    getInputProps: getBannerInputProps,
  } = useDropzone({
    onDrop: onDropBanners,
    accept: { "image/jpeg": [], "image/png": [], "image/jpg": [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 5,
    multiple: true,
  });

  return (
    <div className="space-y-8">
      {/* Store Name */}
      <div>
        <Label htmlFor="name">
          Store Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g. Sunny Threads Boutique"
          {...register("name", { required: "Store name is required." })}
          className={cn(errors.name && "border-red-500")}
        />
        {errors.name?.message && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Store Description</Label>
        <Textarea
          id="description"
          placeholder="Tell customers what your store is about..."
          {...register("description")}
        />
      </div>

      {/* Logo Upload */}
      <div>
        <Label>
          Store Logo <span className="text-red-500">*</span>
        </Label>
        <div
          {...getLogoRootProps()}
          className={cn(
            "dropzone border-2 border-dashed p-5 rounded-lg cursor-pointer text-center transition",
            uploadingLogo ? "opacity-60" : "",
            errors.logo ? "border-red-500" : "border-gray-300"
          )}
        >
          <input {...getLogoInputProps()} />
          {uploadingLogo ? (
            <Loader2 className="animate-spin mx-auto w-6 h-6" />
          ) : (
            <>
              <UploadCloud className="mx-auto text-blue-500 w-10 h-10" />
              <p className="text-lg font-semibold text-gray-800 mb-1">
                Drag 'n' drop your logo here
              </p>
              <p className="text-sm text-gray-600 mb-3">
                or click to select file
              </p>
              <Button
                type="button"
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Choose File
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PNG, JPEG, JPG (Max 5MB)
              </p>
            </>
          )}
        </div>
        {errors.logo?.message && (
          <p className="text-sm text-red-500 mt-1">{errors.logo.message}</p>
        )}
        {currentLogo && (
          <div className="mt-3">
            <img
              src={currentLogo}
              alt="Logo Preview"
              className="h-24 w-24 rounded-full object-cover border border-gray-300 shadow-sm"
              onError={(e) =>
                (e.currentTarget.src =
                  "https://placehold.co/96x96?text=Invalid+Logo")
              }
            />
          </div>
        )}
      </div>

      {/* Banner Upload */}
      <div>
        <Label>Store Banners (max 5)</Label>
        <div
          {...getBannerRootProps()}
          className={cn(
            "dropzone border-2 border-dashed p-5 rounded-lg cursor-pointer text-center transition",
            uploadingBanners ? "opacity-60" : "",
            errors.banners ? "border-red-500" : "border-gray-300"
          )}
        >
          <input {...getBannerInputProps()} />
          {uploadingBanners ? (
            <Loader2 className="animate-spin mx-auto w-6 h-6" />
          ) : (
            <>
              <ImageIcon className="mx-auto text-blue-500 w-10 h-10" />
              <p className="text-lg font-semibold text-gray-800 mb-1">
                Drag 'n' drop banner images here
              </p>
              <p className="text-sm text-gray-600 mb-3">
                or click to select files
              </p>
              <Button
                type="button"
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Choose Files
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PNG, JPEG, JPG (Max 5MB each, up to 5 files)
              </p>
            </>
          )}
        </div>
        {errors.banners?.message && (
          <p className="text-sm text-red-500 mt-1">{errors.banners.message}</p>
        )}
        {currentBanners.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {currentBanners.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`Banner ${idx + 1}`}
                  className="rounded-md object-cover w-full h-28"
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://placehold.co/200x112?text=Invalid+Image")
                  }
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeBanner(idx)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
