// lib/upload-image.ts
import cloudinary from "./cloudinary";

export async function uploadImage(file: string, folder: string = "stores") {
  const uploadResponse = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "image",
  });

  return uploadResponse.secure_url; // return only the URL
}
// }
