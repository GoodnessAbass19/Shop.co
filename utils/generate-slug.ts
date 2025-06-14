// lib/utils/slugify.ts
import slugify from "slugify";
import prisma from "@/lib/prisma"; // Assuming your Prisma client is exported from here

// Basic slug generation (lowercase, strict, hyphens)
export function generateSlug(input: string) {
  return slugify(input, {
    lower: true,
    strict: true,
    replacement: "-",
    trim: true,
  });
}

/**
 * Generates a unique slug for a given model (Product or Store).
 * It appends a counter if the slug already exists.
 *
 * @param modelName The name of the Prisma model ('Product' or 'Store').
 * @param name The original name from which to generate the slug (e.g., product name, store name).
 * @param currentRecordId (Optional) The ID of the record being updated. This prevents
 * the unique check from flagging the record itself as a duplicate.
 * @returns A unique slug string.
 */
export async function generateUniqueSlug(
  modelName: "Product" | "Store",
  name: string,
  currentRecordId?: string
): Promise<string> {
  const baseSlug = generateSlug(name); // Use your basic slug generator
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    let existingRecord;

    // Dynamically query the correct Prisma model
    if (modelName === "Product") {
      existingRecord = await prisma.product.findUnique({
        where: { slug: slug },
        select: { id: true },
      });
    } else {
      // modelName === 'Store'
      existingRecord = await prisma.store.findUnique({
        where: { slug: slug },
        select: { id: true },
      });
    }

    // If no existing record with this slug, or if the existing record is the one we're updating,
    // then the slug is unique for our purpose.
    if (
      !existingRecord ||
      (currentRecordId && existingRecord.id === currentRecordId)
    ) {
      break;
    }

    // If the slug exists and belongs to another record, increment counter and try again
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
}
