// utils/slugify.ts
import slugify from "slugify";

export function generateSlug(input: string) {
  return slugify(input, {
    lower: true,
    strict: true,
    replacement: "-",
    trim: true,
  });
}
