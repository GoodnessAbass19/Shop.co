"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { Button } from "../ui/button";
import { UploadCloud } from "lucide-react";

type StoreSetupData = {
  name: string;
  category: string;
  description: string;
};

export default function StoreSetupForm({
  onNext,
}: {
  onNext: (data: any) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreSetupData>();
  const [logo, setLogo] = useState<string | null>(null);
  const [banners, setBanners] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDropLogo = async (acceptedFiles: File[]) => {
    setUploading(true);
    const uploaded = await uploadToCloudinary(acceptedFiles[0]);
    setLogo(uploaded);
    setUploading(false);
  };
  // console.log(logo);
  const onDropBanners = async (acceptedFiles: File[]) => {
    setUploading(true);
    const uploadedUrls = await Promise.all(
      acceptedFiles.map(uploadToCloudinary)
    );
    setBanners((prev) => [...prev, ...uploadedUrls]);
    setUploading(false);
  };

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps } =
    useDropzone({
      onDrop: onDropLogo,
      accept: {
        "image/jpeg": [],
        "image/png": [],
      },
      multiple: false,
    });

  const {
    getRootProps: getBannerRootProps,
    getInputProps: getBannerInputProps,
  } = useDropzone({
    onDrop: onDropBanners,
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    multiple: true,
    maxFiles: 5, // limit to 5 banners
    maxSize: 5 * 1024 * 1024, // limit to 5MB per file
    // onDropRejected: (fileRejections) => {
    //   alert(
    //     `Some files were rejected: ${fileRejections
    //       .map((r) => r.errors.map((e) => e.message).join(", "))
    //       .join("; ")}`
    //   );
    // },
  });

  const onSubmit = (data: StoreSetupData) => {
    if (!logo || banners.length === 0) {
      // alert("Please upload logo and at least one banner.");
      return;
    }

    const formData = {
      ...data,
      logo,
      banners,
    };

    onNext(formData); // move to next step with collected data
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
      <div>
        <Label className="text-lg font-semibold capitalize mb-2 block text-[#303031]">
          Store Name
        </Label>
        <Input
          {...register("name", { required: "Store name is required" })}
          className="input"
        />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-semibold capitalize mb-2 block text-[#303031]">
          Category
        </Label>
        <Input
          {...register("category", { required: "Category is required" })}
          className="input"
        />
        {errors.category && (
          <p className="text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div>
        <Label className="text-lg font-semibold capitalize mb-2 block text-[#303031]">
          Description
        </Label>
        <Textarea {...register("description")} className="input" />
      </div>

      <div>
        <Label className="text-lg font-semibold capitalize mb-2 block text-[#303031]">
          Upload Store Logo
        </Label>
        <div
          {...getLogoRootProps()}
          className="dropzone cursor-pointer border border-dashed border-blue-500 p-4 rounded-md w-full"
        >
          <Input {...getLogoInputProps()} />
          <div className="flex flex-col items-center justify-center">
            {/* <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M10 9L15 12L10 15V9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div> */}
            <UploadCloud className="w-8 h-10 text-[#0065FF] mb-2" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Upload Store Logo
            </h3>

            {/* <p className="text-gray-600 mb-2">Upload Logo</p> */}
            <p className="text-sm text-gray-500 mb-4">
              Drag 'n' drop file here, or click to select file
            </p>
            <p className="text-xs text-gray-400">
              Supported formats: PNG, JPEG, JPG (up to 5MB)
            </p>
            <button className="mt-4 px-4 py-2 bg-[#0065FF] text-white rounded-full text-sm">
              Choose File
            </button>
          </div>
        </div>
        {logo && <img src={logo} alt="Store Logo" className="w-24 h-24 mt-2" />}
      </div>

      <div>
        <Label className="text-lg font-semibold capitalize mb-2 block text-[#303031]">
          Upload Banners (multiple)
        </Label>
        <div
          {...getBannerRootProps()}
          className="dropzone cursor-pointer border border-dashed border-blue-500 p-4 rounded-md w-full"
        >
          <Input {...getBannerInputProps()} />
          <div className="flex flex-col items-center justify-center">
            {/* <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M10 9L15 12L10 15V9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div> */}

            <UploadCloud className="w-8 h-10 text-[#0065FF] mb-2" />
            <p className="text-gray-600 mb-2">Upload store images</p>
            <p className="text-sm text-gray-500 mb-4">
              Drag 'n' drop some files here, or click to select files (up to 5)
            </p>
            <p className="text-xs text-gray-400">
              Supported formats: PNG, JPEG, JPG (up to 5MB each)
            </p>
            <button className="mt-4 px-4 py-2 bg-[#0065FF] text-white rounded-full text-sm">
              Choose File
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {banners.map((url, idx) => (
            <Image
              key={idx}
              src={url}
              alt={`banner-${idx}`}
              width={500}
              height={500}
              className="w-24 h-24"
            />
          ))}
        </div>
      </div>

      <Button type="submit" disabled={uploading} className="btn-primary mt-4">
        {uploading ? "Uploading..." : "Next"}
      </Button>
    </form>
  );
}
