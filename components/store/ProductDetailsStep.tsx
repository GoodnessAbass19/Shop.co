"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useState } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";

type ProductFormProps = {
  onSubmit: (product: any) => void;
  onBack: () => void;
};

type Variant = {
  size?: string;
  color?: string;
  stock: number;
  price: number;
};

export default function ProductForm({ onSubmit, onBack }: ProductFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      isFeatured: false,
      images: [],
      variants: [{ size: "", color: "", stock: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    const urls = await Promise.all(acceptedFiles.map(uploadToCloudinary));
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const submitHandler = (data: any) => {
    if (images.length === 0) {
      alert("Please upload at least one product image.");
      return;
    }

    onSubmit({ ...data, images });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
      <h2 className="text-xl font-semibold">Add Product</h2>

      <div>
        <label>Product Name</label>
        <input
          {...register("name", { required: "Product name is required" })}
          className="input"
        />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <label>Description</label>
        <textarea {...register("description")} className="input" />
      </div>

      <div>
        <label>Category</label>
        <input
          {...register("category", { required: "Category is required" })}
          className="input"
        />
        {errors.category && (
          <p className="text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label>Featured?</label>
        <input type="checkbox" {...register("isFeatured")} />
      </div>

      <div>
        <label>Product Images</label>
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          <p>Drag & drop images or click to upload</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt="product"
              className="w-24 h-24 rounded"
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Variants</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="border p-3 rounded mt-2 space-y-2">
            <input
              {...register(`variants.${index}.size`)}
              placeholder="Size"
              className="input"
            />
            <input
              {...register(`variants.${index}.color`)}
              placeholder="Color"
              className="input"
            />
            <input
              type="number"
              {...register(`variants.${index}.stock`, { valueAsNumber: true })}
              placeholder="Stock"
              className="input"
            />
            <input
              type="number"
              step="0.01"
              {...register(`variants.${index}.price`, { valueAsNumber: true })}
              placeholder="Price"
              className="input"
            />
            <button
              type="button"
              className="text-red-500 text-sm"
              onClick={() => remove(index)}
            >
              Remove Variant
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ size: "", color: "", stock: 1, price: 0 })}
          className="mt-2 text-blue-500"
        >
          + Add Variant
        </button>
      </div>

      <div className="flex justify-between mt-6">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? "Uploading..." : "Finish & Create Store"}
        </button>
      </div>
    </form>
  );
}
