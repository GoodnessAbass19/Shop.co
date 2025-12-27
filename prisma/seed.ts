// prisma/seed.ts
import prisma from "@/lib/prisma";
import { SpecInputType } from "@prisma/client";

async function main() {
  // await prisma.category;

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      image: "https://example.com/cat/electronics.png",
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: {
      name: "Fashion",
      slug: "fashion",
      image: "https://example.com/cat/fashion.png",
    },
  });

  const audio = await prisma.subCategory.upsert({
    where: { slug: "home-audio" },
    update: {},
    create: {
      name: "Home Audio",
      slug: "home-audio",
      categoryId: electronics.id,
    },
  });

  const clothing = await prisma.subCategory.upsert({
    where: { slug: "mens-fashion" },
    update: {},
    create: {
      name: "Men's Fashion",
      slug: "mens-fashion",
      categoryId: fashion.id,
    },
  });

  const headphones = await prisma.subSubCategory.upsert({
    where: { slug: "sound-bars" },
    update: {},
    create: {
      name: "Sound Bars",
      slug: "sound-bars",
      subCategoryId: audio.id,
    },
  });

  const tshirts = await prisma.subSubCategory.upsert({
    where: { slug: "mens-clothing" },
    update: {},
    create: {
      name: "Clothing",
      slug: "mens-clothing",
      subCategoryId: clothing.id,
    },
  });

  console.log("Categories created");

  await prisma.specificationDefinition.createMany({
    data: [
      // Electronics
      {
        name: "Battery Capacity",
        unit: "mAh",
        inputType: SpecInputType.NUMBER,
        categoryId: electronics.id,
      },
      {
        name: "Connectivity",
        inputType: SpecInputType.SELECT,
        categoryId: electronics.id,
      },
      {
        name: "Warranty",
        unit: "years",
        inputType: SpecInputType.SELECT,
        categoryId: electronics.id,
      },

      // Fashion
      {
        name: "Material",
        inputType: SpecInputType.TEXT,
        categoryId: fashion.id,
      },
      {
        name: "Fit Type",
        inputType: SpecInputType.SELECT,
        categoryId: fashion.id,
      },
      {
        name: "Care Instructions",
        inputType: SpecInputType.RICHTEXT,
        categoryId: fashion.id,
      },
    ],
  });

  const specs = await prisma.specificationDefinition.findMany();
  const specMap = Object.fromEntries(specs.map((s) => [s.name, s.id]));

  console.log("🌴Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
