"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { z } from "zod";
// import { FormDataSchema } from '@/lib/schema'
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "next/image";
import { cn, countries, nigerianStates } from "@/lib/utils";
import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import "react-phone-number-input/style.css";
import { CountryCode, E164Number } from "libphonenumber-js/core";
import PhoneInput from "react-phone-number-input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AccountType } from "@prisma/client";
import { FormDataSchema } from "@/lib/form-schema";

type Inputs = z.infer<typeof FormDataSchema>;

const stepFields = [
  {
    id: "Step 1",
    name: "Country",
    fields: ["country"],
  },
  {
    id: "Step 2",
    name: "Store Name",
    fields: ["storeName"],
  },
  {
    id: "Step 3",
    name: "Shop Information",
    fields: ["state", "terms", "account_type"],
  },
  {
    id: "Step 4",
    name: "Contact Information",
    fields: ["email", "phone"],
  },
];

const storeNameVerification = async (name: string): Promise<boolean> => {
  try {
    const res = await fetch(
      `/api/verify-store-name?name=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    return data.exists;
  } catch (error) {
    console.error("Error verifying store name:", error);
    return false;
  }
};

export default function Form() {
  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const delta = currentStep - previousStep;
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(FormDataSchema),
  });

  const createStoreMutation = useMutation({
    mutationFn: async (formData: Inputs) => {
      const res = await fetch("/api/store", {
        method: "POST",
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
      // Handle success (e.g., redirect, show toast, etc.)
      // console.log("Store created!", data);
      router.prefetch("/your/store/dashboard");
      router.push("/your/store/dashboard");
    },
    onError: (error: any) => {
      // Handle error (e.g., show toast)
      console.error("Store creation failed:", error.message);
    },
  });

  const processForm: SubmitHandler<Inputs> = (data) => {
    createStoreMutation.mutate(data);
    reset();
    router.prefetch("/your/store/dashboard");
    router.push("/your/store/dashboard");
  };

  type FieldName = keyof Inputs;

  const handleStoreNameCheck = async () => {
    const storeName = watch("storeName");
    const exists = await storeNameVerification(storeName);
    if (exists) {
      // Show error to user
      setError("storeName", {
        type: "manual",
        message: "Store name already exists.",
      });
    }
  };

  const next = async () => {
    const fields = stepFields[currentStep].fields;
    const output = await trigger(fields as FieldName[], { shouldFocus: true });

    if (!output) return;

    // On store name step, check for uniqueness and block if exists
    if (currentStep === 1) {
      await handleStoreNameCheck();
      // Re-read errors after async setError
      if (
        watch("storeName") &&
        (await storeNameVerification(watch("storeName")))
      ) {
        return;
      }
      if (errors.storeName?.message) return;
    }

    // On last step, submit the form
    if (currentStep === steps.length - 1) {
      await handleSubmit(processForm)();
      return;
    }

    setPreviousStep(currentStep);
    setCurrentStep((step) => step + 1);
  };

  const totalSteps = 4;
  // An array to easily map over and render each step
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  const handleChange = (value: string) => {
    setValue("country", value);
  };

  const handleStateChange = (value: string) => {
    setValue("state", value);
  };

  if (createStoreMutation.isPending) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-screen-2xl min-h-[80vh] flex flex-col justify-center items-center">
      <div className="w-full grid md:grid-cols-2 justify-center items-start gap-10">
        <div className="w-full col-span-1">
          <Image
            src={"/signup-background.svg"}
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
          <form className="mt-12 py-12" onSubmit={handleSubmit(processForm)}>
            {currentStep === 0 && (
              <motion.div
                initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6"
              >
                <Card className="w-full border outline-none shadow-none rounded-lg bg-white">
                  <CardHeader className="space-y-1 text-center capitalize">
                    <CardTitle className="font-semibold text-xl">
                      sell on shop.co
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Choose the country of your shop.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label
                        htmlFor="country"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Country
                      </Label>
                      <Select
                        defaultValue=""
                        {...register("country")}
                        value={watch("country")}
                        onValueChange={handleChange}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full",
                            errors.country ? "border-red-400" : ""
                          )}
                        >
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem
                              key={country.label}
                              value={country.value}
                            >
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.country?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.country.message}
                        </p>
                      )}

                      <Button
                        type="button"
                        className="mt-4 w-full bg-black text-white hover:bg-gray-800 text-base capitalize"
                        onClick={next}
                      >
                        Next
                      </Button>
                      <span className="text-xs text-gray-600 font-normalmt-1">
                        Only for sellers registered & selling in their own
                        country
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-base text-gray-700 mt-4 font-sans text-center font-medium">
                  Already have an account?{" "}
                  <HoverPrefetchLink
                    href={`/sign-in?redirectUrl=${encodeURIComponent(
                      "your/store/create"
                    )}`}
                    className="text-blue-600 hover:underline"
                  >
                    Login
                  </HoverPrefetchLink>
                </p>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Card className="w-full border outline-none shadow-none rounded-lg bg-white">
                  <CardHeader className="space-y-1 text-center capitalize">
                    <CardTitle className="font-semibold text-xl">
                      Setup Your Store
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Choose a name for your shop.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label
                        htmlFor="storeName"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Store Name*
                      </Label>
                      <Input
                        type="text"
                        id="storeName"
                        {...register("storeName")}
                        placeholder="Enter store name"
                        className={cn(
                          "mt-1 block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.storeName ? "border-red-400" : ""
                        )}
                      />
                      {errors.storeName?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.storeName.message}
                        </p>
                      )}

                      <Button
                        type="button"
                        className="mt-4 w-full bg-black text-white hover:bg-gray-800 text-base capitalize"
                        onClick={next}
                      >
                        Next
                      </Button>
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
                <Card className="w-full border outline-none shadow-none rounded-lg bg-white">
                  <CardHeader className="space-y-1 text-center capitalize">
                    <CardTitle className="font-semibold text-xl">
                      Shop Information
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Setup your shop by completing the following details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 space-y-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor=""
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Acounnt Type*
                      </Label>
                      <RadioGroup
                        defaultValue=""
                        onValueChange={(value: AccountType) =>
                          setValue("account_type", value)
                        }
                        className="h-11 gap-6 xl:justify-between flex items-center"
                      >
                        <div className="flex h-full flex-1 items-center gap-2 rounded-md border border-dashed border-gray-200 bg-gray-100 p-3">
                          <RadioGroupItem value="INDIVIDUAL" id="individual" />
                          <Label
                            htmlFor="individual"
                            className="cursor-pointer"
                          >
                            Individual
                          </Label>
                        </div>
                        <div className="flex h-full flex-1 items-center gap-2 rounded-md border border-dashed border-gray-200 bg-gray-100 p-3">
                          <RadioGroupItem value="BUSINESS" id="business" />
                          <Label htmlFor="business" className="cursor-pointer">
                            Business
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="state"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        State/Province*
                      </Label>

                      <Select
                        defaultValue=""
                        {...register("state")}
                        value={watch("state")}
                        onValueChange={handleStateChange}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full",
                            errors.state ? "border-red-400" : ""
                          )}
                        >
                          <SelectValue placeholder="Shipping Zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {nigerianStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.state?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.state.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="checkbox"
                          id="terms"
                          {...register("terms")}
                          className={cn(
                            "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
                            errors.terms ? "border-red-400" : ""
                          )}
                        />
                        <Label
                          htmlFor="terms"
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          I hereby confirm that I have read and I agree to the{" "}
                          <HoverPrefetchLink
                            href="/terms-of-service"
                            className="text-blue-600 hover:underline"
                          >
                            Terms of Service
                          </HoverPrefetchLink>{" "}
                          of Shop.co.
                        </Label>
                      </div>
                      {errors.terms?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.terms.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      className="mt-4 w-full bg-black text-white hover:bg-gray-800 text-base capitalize"
                      onClick={next}
                    >
                      Next
                    </Button>
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
                <Card className="w-full border outline-none shadow-none rounded-lg bg-white">
                  <CardHeader className="space-y-1 text-center capitalize">
                    <CardTitle className="font-semibold text-xl">
                      Contact Information
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Contact Information for your store.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 space-y-4">
                    <div>
                      <Label
                        htmlFor="email"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Email*
                      </Label>
                      <Input
                        type="email"
                        id="email"
                        {...register("email")}
                        placeholder="Enter store email"
                        className={cn(
                          "mt-1 block w-full rounded-md border placeholder:text-sm border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-2 py-4",
                          errors.email ? "border-red-400" : ""
                        )}
                      />
                      {errors.email?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor=""
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Phone Number*
                      </Label>
                      <PhoneInput
                        defaultCountry={
                          (watch("country") as CountryCode) || "US"
                        }
                        placeholder={"123-456-7890"}
                        value={watch("phone") as E164Number | undefined}
                        international
                        withCountryCallingCode
                        inputComponent={Input}
                        onChange={(value: string | undefined) =>
                          setValue("phone", value ?? "")
                        }
                        className="mt-2 h-12 rounded-md p-3 text-sm border bg-gray-100 placeholder:text-gray-700 border-gray-300 !!important focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                      />
                      {errors.phone?.message && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      className="mt-4 w-full bg-black text-white hover:bg-gray-800 text-base capitalize"
                      onClick={next}
                    >
                      Submit
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
