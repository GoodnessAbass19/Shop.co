"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import StoreSetupForm from "./StoreDetailsStep";
import ProductForm from "./ProductDetailsStep";
import PreviewStep from "./PreviewStep";

export default function MultiStepStoreForm() {
  const [step, setStep] = useState(1);
  const [storeData, setStoreData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleStoreSubmit = (data: any) => {
    setStoreData(data);
    nextStep();
  };

  const handleProductSubmit = (data: any) => {
    setProductData(data);
    nextStep(); // Go to Preview
  };

  const handleFinalSubmit = async () => {
    try {
      setIsLoading(true);
      const payload = {
        ...storeData,
        products: [productData],
      };
      const res = await axios.post("/api/store/create", payload);
      alert("Store and product created successfully!");
      router.push("/dashboard/store");
    } catch (err: any) {
      alert(err?.response?.data?.error || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 bg-white">
      <h1 className="text-2xl font-bold mb-6">Create Your Store</h1>
      <div className="mb-6">
        <StepIndicator current={step} />
      </div>

      {step === 1 && <StoreSetupForm onNext={handleStoreSubmit} />}
      {step === 2 && (
        <ProductForm onSubmit={handleProductSubmit} onBack={prevStep} />
      )}
      {step === 3 && (
        <PreviewStep
          store={storeData}
          product={productData}
          onBack={prevStep}
          onConfirm={handleFinalSubmit}
          loading={isLoading}
        />
      )}
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { label: "Store Details" },
    { label: "First Product" },
    { label: "Preview & Confirm" },
  ];
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const stepNumber = idx + 1;
        return (
          <div key={idx} className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full text-white flex items-center justify-center ${
                current >= stepNumber ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              {stepNumber}
            </div>
            <span className="text-sm">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
