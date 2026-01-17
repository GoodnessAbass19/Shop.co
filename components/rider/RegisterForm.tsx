"use client";

import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Check,
  ImageIcon,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RiderInfoSchema } from "@/lib/form-schema";
import { Label } from "../ui/label";
import { Input } from "@/components/ui/input";
import PhoneInput from "react-phone-number-input";
import { E164Number } from "libphonenumber-js/core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/Hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type Inputs = z.infer<typeof RiderInfoSchema>;

const stepFields = [
  {
    id: "Step 1",
    name: "Create Account",
    fields: [],
  },
  {
    id: "Step 2",
    name: "Personal Information",
    fields: [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "gender",
      "dateOfBirth",
      "nextOfKinName",
      "nextOfKinPhone",
    ],
  },
  {
    id: "Step 3",
    name: "Verification Information",
    fields: [
      "driversLicenseImage",
      "nin",
      "bvn",
      "ninImage",
      "vehicleType",
      "vehicleModel",
      "plateNumber",
      "guarantor1Name",
      "guarantor1Phone",
      "guarantor1Relationship",
      "guarantor2Name",
      "guarantor2Phone",
      "guarantor2Relationship",
    ],
  },
  {
    id: "Step 4",
    name: "Bank Information",
    fields: ["bankName", "accountNumber", "accountName"],
  },
];

const RiderForm = () => {
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingNINImage, setUploadingNINImage] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(RiderInfoSchema),
  });

  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const delta = currentStep - previousStep;
  type FieldName = keyof Inputs;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const licenseImage = watch("driversLicenseImage");
  const ninImage = watch("ninImage");
  const router = useRouter();

  const createRiderMutation = useMutation({
    mutationFn: async (formData: Inputs) => {
      const res = await fetch("/api/rider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create rider account.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      reset();
      toast({
        title: "Rider Account Created",
        description: "Your rider account has been created successfully.",
      });
      // Redirect to rider dashboard
      router.prefetch("/logistics/rider/dashboard");
      router.push("/logistics/rider/dashboard");
    },
    onError: (error: any) => {
      // Handle error (e.g., show toast)
      console.error("Rider Account creation failed:", error.message);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create rider account.",
        variant: "destructive",
      });
    },
  });

  const processForm: SubmitHandler<Inputs> = (data) => {
    createRiderMutation.mutate(data);
  };

  const totalSteps = 4;
  // An array to easily map over and render each step
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  const next = async () => {
    const fields = stepFields[currentStep].fields;
    const output = await trigger(fields as FieldName[], { shouldFocus: true });

    if (!output) return;

    // On last step, submit the form
    if (currentStep === steps.length - 1) {
      await handleSubmit(processForm)();
      return;
    }

    setPreviousStep(currentStep);
    setCurrentStep(currentStep + 1);
  };

  const prev = async () => {
    setCurrentStep((step) => step - 1);
    setPreviousStep(currentStep - 1);
  };

  const handleChange = (field: string, value: string) => {
    setValue(field as keyof Inputs, value);
  };

  const handleGenderChange = (value: string) => {
    setValue("gender", value as "MALE" | "FEMALE");
  };

  // Helper to get error message for a given field path
  const getErrorMessage = (path: string) => {
    const error = errors;
    const errorObject = path.split(".").reduce((acc, part) => {
      return (
        acc &&
        (acc[parseInt(part)] !== undefined ? acc[parseInt(part)] : acc[part])
      );
    }, error as any);
    return errorObject?.message;
  };

  const onDropImage = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        toast({
          title: "File rejected",
          description: "Please upload an image file (PNG, JPEG, JPG).",
          variant: "destructive",
        });
        return;
      }
      setUploadingImage(true);
      try {
        // Only upload the first file
        const uploadedUrl = await uploadToCloudinary(acceptedFiles[0]);
        setValue("driversLicenseImage", uploadedUrl, { shouldValidate: true });
        toast({
          title: "Image Uploaded",
          description: "Image uploaded successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload image.",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
      }
    },
    [setValue, toast]
  );

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } =
    useDropzone({
      onDrop: onDropImage,
      accept: { "image/jpeg": [], "image/png": [] },
      // multiple: true,
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

  const onDropNINImage = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        toast({
          title: "File rejected",
          description: "Please upload an image file (PNG, JPEG, JPG).",
          variant: "destructive",
        });
        return;
      }
      setUploadingNINImage(true);
      try {
        // Only upload the first file
        const uploadedUrl = await uploadToCloudinary(acceptedFiles[0]);
        setValue("ninImage", uploadedUrl, { shouldValidate: true });
        toast({
          title: "Image Uploaded",
          description: "Image uploaded successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload image.",
          variant: "destructive",
        });
      } finally {
        setUploadingNINImage(false);
      }
    },
    [setValue, toast]
  );

  const {
    getRootProps: getImageNINRootProps,
    getInputProps: getImageNINInputProps,
  } = useDropzone({
    onDrop: onDropNINImage,
    accept: { "image/jpeg": [], "image/png": [] },
    // multiple: true,
    maxFiles: 1,
    maxSize: 3 * 1024 * 1024, // 5MB per file
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
    <section className="w-full max-w-screen-2xl min-h-[80vh] flex flex-col justify-center items-center">
      <div className="w-full grid md:grid-cols-2 justify-center items-center gap-10">
        <div className="w-full col-span-1">
          <Image
            src={"/rider.svg"}
            width={500}
            height={500}
            alt="background"
            priority
            className="w-full h-full object-cover object-center"
          />

          <div aria-label="Progress" className="mt-10 w-3/5 mx-auto">
            {/* Progress bar container */}
            <div className="flex items-center justify-between relative w-full">
              {/* Horizontal line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-200 z-0 transform -translate-y-1/2 rounded-full"></div>
              <div
                className="absolute top-1/2 left-0 h-1 bg-blue-500 z-10 transition-all duration-500 ease-in-out rounded-full"
                style={{
                  width: `${(currentStep / (totalSteps - 1)) * 100}%`,
                }}
              ></div>

              {/* Steps (circles) */}
              {steps.map((step) => (
                <div
                  key={step}
                  className={cn(
                    "relative z-20 flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300",
                    {
                      "bg-blue-500 text-white shadow-md": step <= currentStep,
                      "bg-blue-200 text-white": step > currentStep,
                    }
                  )}
                >
                  {/* Display checkmark if step is completed, otherwise display step number */}
                  {step < currentStep ? <Check size={15} /> : ""}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full col-span-1 max-w-xl mx-auto">
          <form onSubmit={handleSubmit(processForm)}>
            {currentStep === 0 && (
              <motion.div
                initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Card className="w-full border outline-none shadow-none rounded-lg bg-[#f6f6f6]">
                  <CardHeader className="space-y-1 text-center capitalize">
                    <CardTitle className="font-semibold text-xl">
                      Become a Shopco Rider
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Join our team and start delivering with Shopco
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 space-y-4">
                    <Button
                      onClick={next}
                      className="w-full capitalize bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ease-in-out duration-150 font-sans font-medium"
                    >
                      sign up as a new rider
                    </Button>

                    <p className="text-base text-gray-700 mt-4 font-sans text-center font-medium">
                      Already have an account?{" "}
                      <HoverPrefetchLink
                        href={`/logistics/rider/login`}
                        className="text-blue-600 hover:underline"
                      >
                        Login
                      </HoverPrefetchLink>
                    </p>
                    {/* <Link
                      href="/logistics/rider/login"
                      className="w-full text-center text-blue-600 hover:underline transition ease-in-out duration-150"
                    >
                      Already have a rider? Log in 
                    </Link> */}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Card className="w-full border outline-none shadow-none rounded-lg bg-[#ffffff] lg:max-h-[70vh] overflow-y-scroll">
                  <CardHeader className="space-y-1 text-center capitalize">
                    <CardTitle className="font-semibold text-xl">
                      Personal Details
                    </CardTitle>
                    {/* <CardDescription className="text-sm text-gray-600">

                    </CardDescription> */}
                  </CardHeader>

                  <CardContent className="grid gap-2.5 space-y-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="firstName"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="w-full rounded-md overflow-hidden border border-gray-300 p-1 flex gap-1 items-center">
                        <User className="w-5 h-5 text-gray-500" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Enter your first name"
                          autoComplete="name"
                          className={cn(
                            "block w-full rounded-md placeholder:text-sm border-none shadow-sm sm:text-base",
                            "focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:outline-none", // Added focus:shadow-none
                            "active:outline-none active:border-none",
                            errors.firstName ? "border-red-400" : ""
                          )}
                          {...register("firstName")}
                        />
                      </div>
                      {errors.firstName?.message && (
                        <p className=" text-sm text-red-400">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="lastName"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="w-full rounded-md overflow-hidden border border-gray-300 p-1 flex gap-1 items-center">
                        <User className="w-5 h-5 text-gray-500" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Enter your first name"
                          autoComplete="name"
                          className={cn(
                            "block w-full rounded-md placeholder:text-sm border-none shadow-sm sm:text-base",
                            "focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:outline-none",
                            "active:outline-none active:border-none",
                            errors.lastName ? "border-red-400" : ""
                          )}
                          {...register("lastName")}
                        />
                      </div>
                      {errors.lastName?.message && (
                        <p className="text-sm text-red-400">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <PhoneInput
                        defaultCountry={"NG"}
                        placeholder={"123-456-7890"}
                        value={watch("phoneNumber") as E164Number | undefined}
                        international
                        withCountryCallingCode
                        inputComponent={Input}
                        onChange={(value: string | undefined) =>
                          setValue("phoneNumber", value ?? "")
                        }
                        className="mt-2 h-12 rounded-md p-3 text-sm border bg-gray-100 placeholder:text-gray-700 border-gray-300 !!important focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                      />
                      {errors.phoneNumber?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.phoneNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="email"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="w-full rounded-md overflow-hidden border border-gray-300 p-1 flex gap-1 items-center">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <Input
                          type="email"
                          id="email"
                          {...register("email")}
                          placeholder="Enter your email"
                          className={cn(
                            "block w-full rounded-md placeholder:text-sm border-none shadow-sm sm:text-base",
                            "focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none",
                            "active:outline-none active:border-none",
                            errors.email ? "border-red-400" : ""
                          )}
                        />
                      </div>
                      {errors.email?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="gender"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Gender <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={watch("gender")}
                        onValueChange={handleGenderChange}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full",
                            errors.gender ? "border-red-400" : ""
                          )}
                        >
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.gender.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="dateOfBirth"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>

                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                            type="button"
                            onClick={() => setOpen(true)}
                          >
                            {date ? (
                              format(date, "yyyy-MM-dd")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full overflow-hidden p-0"
                          align="center"
                        >
                          <Calendar
                            mode="single"
                            selected={date}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              setDate(date);
                              // setValue(
                              //   "dateOfBirth",
                              //   date ? format(date, "yyyy-MM-dd") : ""
                              // );
                              setValue(
                                "dateOfBirth",
                                date ? date.toISOString() : "",
                                { shouldValidate: true }
                              );
                              setOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.dateOfBirth && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.dateOfBirth.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="nextOfKinName"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Next of Kin Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="w-full rounded-md overflow-hidden border border-gray-300 p-1 flex gap-1 items-center">
                        <User className="w-5 h-5 text-gray-500" />
                        <Input
                          id="nextOfKinName"
                          type="text"
                          placeholder="Next of kin name"
                          className={cn(
                            "block w-full rounded-md placeholder:text-sm border-none shadow-sm sm:text-base",
                            "focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:outline-none",
                            "active:outline-none active:border-none",
                            errors.nextOfKinName ? "border-red-400" : ""
                          )}
                          {...register("nextOfKinName")}
                        />
                      </div>
                      {errors.nextOfKinName?.message && (
                        <p className="text-sm text-red-400">
                          {errors.nextOfKinName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="nextOfKinPhone"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Next of Kin Phone Number{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <PhoneInput
                        defaultCountry={"NG"}
                        placeholder={"123-456-7890"}
                        value={
                          watch("nextOfKinPhone") as E164Number | undefined
                        }
                        international
                        withCountryCallingCode
                        inputComponent={Input}
                        onChange={(value: string | undefined) =>
                          setValue("nextOfKinPhone", value ?? "")
                        }
                        className="mt-2 h-12 rounded-md p-3 text-sm border bg-gray-100 placeholder:text-gray-700 border-gray-300 !!important focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                      />
                      {errors.nextOfKinPhone?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.nextOfKinPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="w-full mt-2">
                      <button
                        type="button"
                        onClick={next}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-full ease-in-out duration-150"
                      >
                        Next
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Card className="w-full border outline-none shadow-none rounded-lg bg-[#ffffff] lg:max-h-[70vh] overflow-y-scroll">
                  <CardHeader className="space-y-1 text-center capitalize">
                    <CardTitle className="font-semibold text-xl">
                      Verification Details
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="grid gap-2.5 space-y-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="driversLicenseImage"
                        className="block text-sm font-medium leading-6 text-gray-900 capitalize"
                      >
                        Upload a picture of your driver's license{" "}
                        <span className="text-red-500">*</span>
                      </Label>

                      <div
                        {...getImageRootProps()}
                        className={cn(
                          "dropzone flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
                          getErrorMessage("images")
                            ? "border-red-500"
                            : "border-blue-400 hover:border-blue-600"
                        )}
                      >
                        <input {...getImageInputProps()} />
                        {uploadingImage ? (
                          <div className="flex flex-col items-center p-4">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-1.5" />
                            <p className=" text-lg font-medium">
                              Uploading Image...
                            </p>
                          </div>
                        ) : licenseImage ? (
                          <div>
                            <Image
                              src={licenseImage!}
                              alt="driver license"
                              width={500}
                              height={500}
                              className="w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-7 h-7 text-blue-600 mx-auto mb-2" />
                            <p className="text-base  mb-1">
                              Drag 'n' drop image here
                            </p>
                            <p className="text-sm mb-3">
                              or click to select file
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              Choose Files
                            </Button>
                            <p className="text-xs  mt-2">
                              Supported formats: PNG, JPEG, JPG (Max 3MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="nin"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        NIN (National Identification Number){" "}
                        <span className="text-red-500">*</span>
                      </Label>

                      <Input
                        id="nin"
                        type="text"
                        placeholder="Enter your NIN"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.nin ? "border-red-400" : ""
                        )}
                        {...register("nin")}
                      />

                      {errors.nin?.message && (
                        <p className="text-sm text-red-400">
                          {errors.nin.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="ninImage"
                        className="block text-sm font-medium leading-6 text-gray-900 capitalize"
                      >
                        Upload a picture of your NIN{" "}
                        <span className="text-red-500">*</span>
                      </Label>

                      <div
                        {...getImageNINRootProps()}
                        className={cn(
                          "dropzone flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
                          getErrorMessage("ninImage")
                            ? "border-red-500"
                            : "border-blue-400 hover:border-blue-600"
                        )}
                      >
                        <input
                          {...getImageNINInputProps()}
                          style={{ display: "none" }}
                        />
                        {uploadingNINImage ? (
                          <div className="flex flex-col items-center p-4">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-1.5" />
                            <p className="text-lg font-medium">
                              Uploading Image...
                            </p>
                          </div>
                        ) : ninImage ? (
                          <div>
                            <Image
                              src={ninImage}
                              alt="nin"
                              width={500}
                              height={500}
                              className="w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-7 h-7 text-blue-600 mx-auto mb-2" />
                            <p className="text-base mb-1">
                              Drag 'n' drop image here
                            </p>
                            <p className="text-sm mb-3">
                              or click to select file
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                // Trigger file input click
                                const input =
                                  document.querySelector<HTMLInputElement>(
                                    'input[type="file"][name="ninImage"]'
                                  );
                                if (input) input.click();
                              }}
                            >
                              Choose Files
                            </Button>
                            <p className="text-xs mt-2">
                              Supported formats: PNG, JPEG, JPG (Max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="bvn"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        BVN <span className="text-gray-700">(optional)</span>
                      </Label>
                      <Input
                        id="bvn"
                        type="text"
                        placeholder="Enter your BVN"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.bvn ? "border-red-400" : ""
                        )}
                        {...register("bvn")}
                      />
                      {errors.bvn?.message && (
                        <p className="text-sm text-red-400">
                          {errors.bvn.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="vehicleType"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Vehicle Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={watch("vehicleType")}
                        onValueChange={(value) =>
                          handleChange("vehicleType", value)
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full",
                            errors.vehicleType ? "border-red-400" : ""
                          )}
                        >
                          <SelectValue placeholder="Select your Vehicle Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                          <SelectItem value="BICYCLE">Bicycle</SelectItem>
                          <SelectItem value="SCOOTER">Scooter</SelectItem>
                          <SelectItem value="CAR">Car</SelectItem>
                          <SelectItem value="VAN">Van</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.vehicleType?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.vehicleType.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="vehicleModel"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Vehicle Model <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="vehicleModel"
                        type="text"
                        placeholder="E.g. Toyota"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.vehicleModel ? "border-red-400" : ""
                        )}
                        {...register("vehicleModel")}
                      />
                      {errors.vehicleModel?.message && (
                        <p className="text-sm text-red-400">
                          {errors.vehicleModel.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="vehicleColor"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Vehicle Color <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="vehicleColor"
                        type="text"
                        placeholder="E.g. Silver"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.vehicleColor ? "border-red-400" : ""
                        )}
                        {...register("vehicleColor")}
                      />
                      {errors.vehicleColor?.message && (
                        <p className="text-sm text-red-400">
                          {errors.vehicleColor.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="plateNumber"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Plate Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="plateNumber"
                        type="text"
                        placeholder="Plate number"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.plateNumber ? "border-red-400" : ""
                        )}
                        {...register("plateNumber")}
                      />
                      {errors.plateNumber?.message && (
                        <p className="text-sm text-red-400">
                          {errors.plateNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="guarantor1Name"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Guarantor 1 Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="guarantor1Name"
                        type="text"
                        placeholder="Gaurantor 1 name"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.guarantor1Name ? "border-red-400" : ""
                        )}
                        {...register("guarantor1Name")}
                      />
                      {errors.guarantor1Name?.message && (
                        <p className="text-sm text-red-400">
                          {errors.guarantor1Name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="guarantor1Phone"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Guarantor 1 Phone{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-4 gap-1 items-center justify-between">
                        <div className="col-span-3">
                          <PhoneInput
                            defaultCountry={"NG"}
                            placeholder={"123-456-7890"}
                            value={
                              watch("guarantor1Phone") as E164Number | undefined
                            }
                            international
                            withCountryCallingCode
                            inputComponent={Input}
                            onChange={(value: string | undefined) =>
                              setValue("guarantor1Phone", value ?? "")
                            }
                            className="mt-2 h-12 rounded-md p-3 text-sm border bg-gray-100 placeholder:text-gray-700 border-gray-300 !!important focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                          />

                          {errors.guarantor1Phone?.message && (
                            <p className="mt-2 text-sm text-red-400">
                              {errors.guarantor1Phone.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Select
                            value={watch("guarantor1Relationship")}
                            onValueChange={(value) =>
                              handleChange("guarantor1Relationship", value)
                            }
                          >
                            <SelectTrigger className="h-11 !rounded-md border border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PARENT">Parent</SelectItem>
                              <SelectItem value="SIBLING">Sibling</SelectItem>
                              <SelectItem value="FRIEND">Friend</SelectItem>
                              <SelectItem value="SPOUSE">Spouse</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>

                          {errors.guarantor1Relationship?.message && (
                            <p className="mt-2 text-sm text-red-400">
                              {errors.guarantor1Relationship.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="guarantor2Name"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Guarantor 2 Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="guarantor2Name"
                        type="text"
                        placeholder="Gaurantor 2 name"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.guarantor2Name ? "border-red-400" : ""
                        )}
                        {...register("guarantor2Name")}
                      />
                      {errors.guarantor2Name?.message && (
                        <p className="text-sm text-red-400">
                          {errors.guarantor2Name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="guarantor2Phone"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Guarantor 2 Phone{" "}
                        <span className="text-red-500">*</span>
                      </Label>

                      <div className="grid grid-cols-4 gap-1 items-center justify-between">
                        <div className="col-span-3">
                          <PhoneInput
                            defaultCountry={"NG"}
                            placeholder={"123-456-7890"}
                            value={
                              watch("guarantor2Phone") as E164Number | undefined
                            }
                            international
                            withCountryCallingCode
                            inputComponent={Input}
                            onChange={(value: string | undefined) =>
                              setValue("guarantor2Phone", value ?? "")
                            }
                            className="mt-2 h-12 rounded-md p-3 text-sm border bg-gray-100 placeholder:text-gray-700 border-gray-300 !!important focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                          />

                          {errors.guarantor2Phone?.message && (
                            <p className="mt-2 text-sm text-red-400">
                              {errors.guarantor2Phone.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Select
                            {...register("guarantor2Relationship")}
                            value={watch("guarantor2Relationship")}
                            onValueChange={(value) =>
                              handleChange("guarantor2Relationship", value)
                            }
                          >
                            <SelectTrigger className="h-11 !rounded-md border border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PARENT">Parent</SelectItem>
                              <SelectItem value="SIBLING">Sibling</SelectItem>
                              <SelectItem value="FRIEND">Friend</SelectItem>
                              <SelectItem value="SPOUSE">Spouse</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>

                          {errors.guarantor2Relationship?.message && (
                            <p className="mt-2 text-sm text-red-400">
                              {errors.guarantor2Relationship.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full mt-2 grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={prev}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-full ease-in-out duration-150"
                      >
                        Previous
                      </button>

                      <button
                        type="button"
                        onClick={next}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-full ease-in-out duration-150"
                      >
                        Next
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Card className="w-full border outline-none shadow-none rounded-lg bg-[#ffffff] lg:max-h-[70vh] overflow-y-scroll">
                  <CardHeader className="space-y-1 text-center capitalize">
                    <CardTitle className="font-semibold text-xl">
                      Bank Details
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="grid gap-2.5 space-y-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="accountNumber"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Account Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder="Account number"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.accountNumber ? "border-red-400" : ""
                        )}
                        {...register("accountNumber")}
                      />
                      {errors.accountNumber?.message && (
                        <p className="text-sm text-red-400">
                          {errors.accountNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="accountName"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Account Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountName"
                        type="text"
                        placeholder="Account name"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.accountName ? "border-red-400" : ""
                        )}
                        {...register("accountName")}
                      />
                      {errors.accountName?.message && (
                        <p className="text-sm text-red-400">
                          {errors.accountName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="bankName"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Account Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bankName"
                        type="text"
                        placeholder="Bank name"
                        className={cn(
                          "block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.bankName ? "border-red-400" : ""
                        )}
                        {...register("bankName")}
                      />
                      {errors.bankName?.message && (
                        <p className="text-sm text-red-400">
                          {errors.bankName.message}
                        </p>
                      )}
                    </div>

                    <div className="w-full my-2 grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={prev}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-full ease-in-out duration-150"
                      >
                        Previous
                      </button>

                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-full ease-in-out duration-150"
                      >
                        {createRiderMutation.isPending
                          ? "Submitting..."
                          : "Submit"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default RiderForm;
