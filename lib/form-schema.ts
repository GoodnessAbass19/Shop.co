import { add } from "date-fns";
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
  state: z.string().min(3, "State is required"),
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
  city: z.string().min(5, "City is required"),
  postalCode: z.string().min(1, "Postal code is required").optional(),
});

export const BusinessInfoSchema = z.object({
  representativeName: z
    .string()
    .min(1, "Legal representative name is required"),
  idType: z.enum(["VOTER_ID", "DRIVER_LICENSE", "PASSPORT", "NATIONAL_ID"]),
  idNumber: z.string().min(1, "ID number is required"),
  idImageFront: z.string().url(),
  idImageBack: z.string().url(),
  // .instanceof(File)
  // .refine((file) => file.size > 0, "ID image back is required"),
  taxIdentificationNumber: z
    .string()
    .min(1, "Tax identification number is required"),
  taxIdImage: z.string().url(),
  // .instanceof(File)
  // .refine((file) => file.size > 0, "Tax ID image is required"),
  vatNumber: z.string().optional(),
  address1: z.string().min(1, "Business address line 1 is required"),
  address2: z.string().optional(),
  state: z.string().min(1, "State is required"),
  city: z.string().min(5, "City is required"),
  postalCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
});

export const ShippingInfoSchema = z.object({
  shippingZone: z.string().min(1, "Shipping zone is required"),
  shippingAddress1: z.string().min(1, "address is required"),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().min(5, "city is required"),
  shippingState: z.string().min(1, "state is required"),
  shippingCountry: z.string().min(1, "country is required"),
  shippingPostalCode: z.string().optional(),
  returnAddress1: z.string().min(1, "address is required"),
  returnAddress2: z.string().optional(),
  returnCity: z.string().min(5, "city is required"),
  returnState: z.string().min(1, "state is required"),
  returnCountry: z.string().min(1, "country is required"),
  returnPostalCode: z.string().optional(),
});
