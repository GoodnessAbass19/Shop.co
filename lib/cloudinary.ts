import axios from "axios";

// lib/uploadToCloudinary.ts
export const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
  );
  formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);

  const response = await axios.post(
    "https://api.cloudinary.com/v1_1/" +
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME +
      "/image/upload",
    formData
  );

  const data = await response.data;
  if (!data || !data.secure_url) {
    throw new Error("Failed to upload image to Cloudinary");
  }
  return data.secure_url as string;
};


