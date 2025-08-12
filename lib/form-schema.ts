import { z } from "zod";

export const userSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
});

export const FormDataSchema = z.object({
  storeName: z.string().min(1, "store is required"),
  country: z.string().min(1, "Country is required"),
  terms: z
    .boolean()
    .default(false)
    .refine((value) => value === true, {
      message: "You must agree to the terms and conditon in order to proceed",
    }),
  account_type: z.enum(["INDIVIDUAL", "BUSINESS"]),
  state: z.string().min(1, "State is required"),
  email: z.string().min(1, "Contact email is required"),
  phone: z
    .string()
    .refine(
      (phone) => /^\+\d{10,15}$/.test(phone),
      "Contact Phone is required"
    ),
});

export const ShopInfoSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  country: z.string().min(1, "Country is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email format"),
  contactPhoneNumber: z.string().min(10, "Phone number is required"),
  customerCareName: z.string().min(1, "Customer care name is required"),
  customerCareEmail: z.string().email("Invalid email format"),
  customerCarePhoneNumber: z.string().min(10, "Phone number is required"),
  customerCareAddress1: z.string().min(1, "Address line 1 is required"),
  customerCareAddress2: z.string().min(1, "Address line 2 is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required").optional(),
});
