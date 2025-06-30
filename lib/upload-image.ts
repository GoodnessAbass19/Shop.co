// lib/upload-image.ts
// import cloudinary from "./cloudinary";

import { uploadToCloudinary } from "./cloudinary";

export async function uploadImage(file: File, folder: string = "stores") {
  const secureUrl = await uploadToCloudinary(file);

  return secureUrl; // return only the URL
}
// }
