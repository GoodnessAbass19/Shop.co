// prisma/seed.ts
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  console.log("Clearing existing data...");
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subSubCategory.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleared existing data.");

  // --- 1. Create Users ---
  const hashedPassword1 = await bcrypt.hash("password123", 10);
  const hashedPassword2 = await bcrypt.hash("securepass", 10);
  const hashedPassword3 = await bcrypt.hash("adminpass", 10);

  const user1 = await prisma.user.create({
    data: {
      email: "john.doe@example.com",
      password: hashedPassword1,
      name: "John Doe",
      role: "BUYER",
      phone: "+2348012345678",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "jane.smith@example.com",
      password: hashedPassword2,
      name: "Jane Smith",
      role: "SELLER",
      phone: "+2347098765432",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: "seller.admin@example.com",
      password: hashedPassword3,
      name: "Admin Seller",
      role: "SELLER",
      phone: "+2349011223344",
    },
  });

  console.log("Created users.");

  // --- 2. Create OTP Tokens (Example for Password Reset/Verification) ---
  const otp1 = await prisma.otpToken.create({
    data: {
      email: "john.doe@example.com",
      token: "123456",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Expires in 5 minutes from now
    },
  });

  const otp2 = await prisma.otpToken.create({
    data: {
      email: "jane.smith@example.com",
      token: "654321",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes from now
    },
  });
  console.log("Created OTP tokens.");

  // --- 3. Create Addresses ---
  const johnsHomeAddress = await prisma.address.create({
    data: {
      userId: user1.id,
      street: "123 Buyer St",
      city: "Victoria Island",
      state: "Lagos",
      postalCode: "101241",
      country: "Nigeria",
      isDefault: true,
    },
  });

  const johnsWorkAddress = await prisma.address.create({
    data: {
      userId: user1.id,
      street: "Unit 5, Tech Hub Plaza",
      city: "Yaba",
      state: "Lagos",
      postalCode: "100001",
      country: "Nigeria",
      isDefault: false,
    },
  });

  const janesHomeAddress = await prisma.address.create({
    data: {
      userId: user2.id,
      street: "456 Seller Rd",
      city: "Lekki Phase 1",
      state: "Lagos",
      postalCode: "106104",
      country: "Nigeria",
      isDefault: true,
    },
  });

  const adminSellerWarehouseAddress = await prisma.address.create({
    data: {
      userId: user3.id,
      street: "789 Admin Ave, Warehouse District",
      city: "Apapa",
      state: "Lagos",
      postalCode: "101230",
      country: "Nigeria",
      isDefault: true,
    },
  });

  console.log("Created addresses.");

  // --- 4. Create Stores ---
  const store1 = await prisma.store.create({
    data: {
      name: "Jane's Boutique",
      description: "Handcrafted goods and unique apparel.",
      logo: "https://placehold.co/150x150/png",
      userId: user2.id, // Jane Smith owns this store
      slug: "janes-boutique", // Example slug, ensure it's unique
    },
  });

  const store2 = await prisma.store.create({
    data: {
      name: "Tech Gadgets Hub",
      description: "Your one-stop shop for cutting-edge electronics.",
      logo: "https://placehold.co/150x150/png",
      userId: user3.id, // Admin Seller owns this store
      slug: "tech-gadgets-hub", // Example slug, ensure it's unique
    },
  });

  console.log("Created stores.");

  // --- 5. Create Categories (Level 1) ---
  const clothingCategory = await prisma.category.create({
    data: { name: "Clothing", slug: "clothing" },
  });

  const electronicsCategory = await prisma.category.create({
    data: { name: "Electronics", slug: "electronics" },
  });

  const accessoriesCategory = await prisma.category.create({
    data: { name: "Accessories", slug: "accessories" },
  });

  console.log("Created categories.");

  // --- 6. Create SubCategories (Level 2) ---
  const mensClothingSub = await prisma.subCategory.create({
    data: {
      name: "Men's Clothing",
      categoryId: clothingCategory.id,
      slug: "mens-clothing", // Example slug, ensure it's unique
    },
  });

  const womensClothingSub = await prisma.subCategory.create({
    data: {
      name: "Women's Clothing",
      categoryId: clothingCategory.id,
      slug: "womens-clothing", // Example slug, ensure it's unique
    },
  });

  const smartphonesSub = await prisma.subCategory.create({
    data: {
      name: "Smartphones",
      categoryId: electronicsCategory.id,
      slug: "smartphones", // Example slug, ensure it's unique
    },
  });

  const laptopsSub = await prisma.subCategory.create({
    data: {
      name: "Laptops",
      categoryId: electronicsCategory.id,
      slug: "laptops", // Example slug, ensure it's unique
    },
  });

  const jewelrySub = await prisma.subCategory.create({
    data: {
      name: "Jewelry",
      categoryId: accessoriesCategory.id,
      slug: "jewelry", // Example slug, ensure it's unique
    },
  });

  console.log("Created subcategories.");

  // --- 7. Create SubSubCategories (Level 3) ---
  const mensTshirtsSubSub = await prisma.subSubCategory.create({
    data: {
      name: "T-Shirts",
      subCategoryId: mensClothingSub.id,
      slug: "mens-tshirts", // Example slug, ensure it's unique
    },
  });
  const mensJeansSubSub = await prisma.subSubCategory.create({
    data: {
      name: "Jeans",
      subCategoryId: mensClothingSub.id,
      slug: "mens-jeans", // Example slug, ensure it's unique
    },
  });

  const womensDressesSubSub = await prisma.subSubCategory.create({
    data: {
      name: "Dresses",
      subCategoryId: womensClothingSub.id,
      slug: "womens-dresses", // Example slug, ensure it's unique
    },
  });
  const womensSkirtsSubSub = await prisma.subSubCategory.create({
    data: {
      name: "Skirts",
      subCategoryId: womensClothingSub.id,
      slug: "womens-skirts", // Example slug, ensure it's unique
    },
  });

  const androidPhonesSubSub = await prisma.subSubCategory.create({
    data: {
      name: "Android Phones",
      subCategoryId: smartphonesSub.id,
      slug: "android-phones", // Example slug, ensure it's unique
    },
  });

  console.log("Created sub-sub categories.");

  // --- 8. Create Products ---
  const mensTshirtProduct = await prisma.product.create({
    data: {
      name: "Classic Fit Cotton T-Shirt",
      description:
        "A comfortable and durable 100% cotton t-shirt for everyday wear.",
      images: [
        "https://placehold.co/300x300/white/black?text=T-Shirt",
        "https://placehold.co/300x300/grey/white?text=T-Shirt",
      ],
      lowStockThreshold: 10,
      storeId: store1.id,
      categoryId: clothingCategory.id,
      subCategoryId: mensClothingSub.id,
      subSubCategoryId: mensTshirtsSubSub.id,
      slug: "classic-fit-cotton-t-shirt", // Example slug, ensure it's unique
    },
  });

  const mensTshirtProduct1 = await prisma.product.create({
    data: {
      name: "Courage Graphic T-shirt",
      description: "Courage Graphic T-shirt for everyone",
      images: [
        "https://eu-west-2.graphassets.com/cm53bnv5406or07ml77xd00wa/cm5nuiyleeblh06lar6j02yii",
        "https://eu-west-2.graphassets.com/cm53bnv5406or07ml77xd00wa/cm5ntu31oe5gr06lauq485e6y",
      ],
      lowStockThreshold: 20,
      stock: 100,
      price: 3000,
      storeId: store1.id,
      categoryId: clothingCategory.id,
      subCategoryId: mensClothingSub.id,
      subSubCategoryId: mensTshirtsSubSub.id,
      slug: "courage-graphic-t-shirt", // Example slug, ensure it's unique
    },
  });

  const mensTshirtProduct1VariantSWhite = await prisma.productVariant.create({
    data: {
      productId: mensTshirtProduct1.id,
      size: "S",
      color: "White",
      price: 3200,
      stock: 50,
      sku: "CR-TSHIRT-S-W",
    },
  });
  const mensTshirtProduct1VariantSBlack = await prisma.productVariant.create({
    data: {
      productId: mensTshirtProduct1.id,
      size: "M",
      color: "White",
      price: 3500,
      stock: 50,
      sku: "CR-TSHIRT-M-W",
    },
  });
  const mensTshirtVariantSWhite = await prisma.productVariant.create({
    data: {
      productId: mensTshirtProduct.id,
      size: "S",
      color: "White",
      price: 20.0,
      stock: 50,
      sku: "CL-TSHIRT-S-W",
    },
  });
  const mensTshirtVariantMWhite = await prisma.productVariant.create({
    data: {
      productId: mensTshirtProduct.id,
      size: "M",
      color: "White",
      price: 21.0,
      stock: 60,
      sku: "CL-TSHIRT-M-W",
    },
  });
  const mensTshirtVariantLBlack = await prisma.productVariant.create({
    data: {
      productId: mensTshirtProduct.id,
      size: "L",
      color: "Black",
      price: 22.5,
      stock: 4,
      sku: "CL-TSHIRT-L-B",
    }, // Removed images field
  });

  const denimSkirtProduct = await prisma.product.create({
    data: {
      name: "High-Waisted Denim Skirt",
      description:
        "Stylish high-waisted denim skirt, perfect for casual outings.",
      images: ["https://placehold.co/300x300/blue/white?text=Denim+Skirt"],
      lowStockThreshold: 5,
      storeId: store1.id,
      categoryId: clothingCategory.id,
      subCategoryId: womensClothingSub.id,
      subSubCategoryId: womensSkirtsSubSub.id,
      slug: "high-waisted-denim-skirt", // Example slug, ensure it's unique
    },
  });

  const denimSkirtVariantSBlue = await prisma.productVariant.create({
    data: {
      productId: denimSkirtProduct.id,
      size: "S",
      color: "Blue",
      price: 45.0,
      stock: 30,
      sku: "CL-SKIRT-S-BL",
    },
  });
  const denimSkirtVariantMBlue = await prisma.productVariant.create({
    data: {
      productId: denimSkirtProduct.id,
      size: "M",
      color: "Blue",
      price: 45.0,
      stock: 40,
      sku: "CL-SKIRT-M-BL",
    },
  });
  const denimSkirtVariantLDark = await prisma.productVariant.create({
    data: {
      productId: denimSkirtProduct.id,
      size: "L",
      color: "Dark Blue",
      price: 48.0,
      stock: 2,
      sku: "CL-SKIRT-L-DBL",
    }, // Removed images field
  });

  const androidSmartphoneProduct = await prisma.product.create({
    data: {
      name: "Latest Android Smartphone",
      description:
        "Powerful and feature-rich smartphone with a stunning display.",
      images: [
        "https://placehold.co/300x300/black/white?text=Android+Phone",
        "https://placehold.co/300x300/silver/black?text=Android+Phone",
      ],
      lowStockThreshold: 3,
      storeId: store2.id,
      categoryId: electronicsCategory.id,
      subCategoryId: smartphonesSub.id,
      subSubCategoryId: androidPhonesSubSub.id,
      slug: "latest-android-smartphone", // Example slug, ensure it's unique
    },
  });

  const androidPhoneVariantBlack128 = await prisma.productVariant.create({
    data: {
      productId: androidSmartphoneProduct.id,
      color: "Black",
      size: "128GB",
      price: 799.99,
      stock: 25,
      sku: "EL-PHONE-B-128",
    }, // Removed images field
  });
  const androidPhoneVariantSilver256 = await prisma.productVariant.create({
    data: {
      productId: androidSmartphoneProduct.id,
      color: "Silver",
      size: "256GB",
      price: 899.99,
      stock: 15,
      sku: "EL-PHONE-S-256",
    }, // Removed images field
  });
  const androidPhoneVariantGreen256 = await prisma.productVariant.create({
    data: {
      productId: androidSmartphoneProduct.id,
      color: "Green",
      size: "256GB",
      price: 929.99,
      stock: 3,
      sku: "EL-PHONE-G-256",
    }, // Removed images field
  });

  const goldNecklaceProduct = await prisma.product.create({
    data: {
      name: "Luxury Gold Necklace",
      description: "Elegant 18k gold necklace with delicate detailing.",
      images: ["https://placehold.co/300x300/gold/black?text=Necklace"],
      lowStockThreshold: 5,
      storeId: store1.id,
      categoryId: accessoriesCategory.id,
      subCategoryId: jewelrySub.id,
      subSubCategoryId: null,
      slug: "luxury-gold-necklace", // Example slug, ensure it's unique
    },
  });

  const goldNecklaceDefaultVariant = await prisma.productVariant.create({
    data: {
      productId: goldNecklaceProduct.id,
      price: 120.0,
      stock: 40,
      sku: "ACC-NECKLACE-DEFAULT",
      size: "One Size",
      color: "Gold",
    },
  });

  console.log("Created products and variants.");

  // --- 9. Create Product Reviews ---
  const review1 = await prisma.productReview.create({
    data: {
      productId: mensTshirtProduct.id,
      userId: user1.id,
      rating: 5,
      comment: "Excellent quality and very comfortable. Highly recommend!",
    },
  });

  const review2 = await prisma.productReview.create({
    data: {
      productId: androidSmartphoneProduct.id,
      userId: user2.id,
      rating: 4,
      comment: "Great phone, camera is amazing. Battery life could be better.",
      reply:
        "Thanks for your feedback! We are constantly working on software updates to optimize battery performance.",
    },
  });

  const review3 = await prisma.productReview.create({
    data: {
      productId: denimSkirtProduct.id,
      userId: user1.id,
      rating: 2,
      comment: "The size runs a bit small, had to return it.",
    },
  });

  console.log("Created product reviews.");

  // --- 10. Create Discounts ---
  const discount1 = await prisma.discount.create({
    data: {
      code: "SUMMER20",
      description: "20% off Summer Collection T-Shirts",
      percentage: 20.0,
      expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 2)), // Expires in 2 months from current time
      productId: mensTshirtProduct.id,
      canBeCombined: false,
    },
  });

  const discount2 = await prisma.discount.create({
    data: {
      description: "Limited-time 15% off on selected Android Phones",
      percentage: 15.0,
      expiresAt: new Date(new Date().setDate(new Date().getDate() + 7)), // Expires in 7 days from current time
      productId: androidSmartphoneProduct.id,
      canBeCombined: true,
    },
  });

  console.log("Created discounts.");

  // --- 11. Create Carts and Cart Items ---
  const johnsCart = await prisma.cart.create({
    data: {
      userId: user1.id,
      cartItems: {
        create: [
          {
            productVariantId: mensTshirtVariantMWhite.id,
            quantity: 2,
          },
          {
            productVariantId: goldNecklaceDefaultVariant.id,
            quantity: 1,
          },
        ],
      },
    },
  });

  const janesCart = await prisma.cart.create({
    data: {
      userId: user2.id,
      cartItems: {
        create: [
          {
            productVariantId: androidPhoneVariantSilver256.id,
            quantity: 1,
          },
        ],
      },
    },
  });

  // Admin seller might also have a cart (e.g., for ordering supplies or personal items)
  const adminCart = await prisma.cart.create({
    data: {
      userId: user3.id,
    },
  }); // Empty cart

  console.log("Created carts and cart items.");

  // --- 12. Create Orders and OrderItems ---
  // Order 1: John Doe buys items, shipped to his home address
  const order1 = await prisma.order.create({
    data: {
      total:
        mensTshirtVariantSWhite.price +
        denimSkirtVariantSBlue.price +
        goldNecklaceDefaultVariant.price,
      status: "PAID",
      buyerId: user1.id,
      addressId: johnsHomeAddress.id, // Link to John's home address
      items: {
        create: [
          {
            quantity: 1,
            price: mensTshirtVariantSWhite.price,
            productVariantId: mensTshirtVariantSWhite.id,
            storeId: store1.id,
          },
          {
            quantity: 1,
            price: denimSkirtVariantSBlue.price,
            productVariantId: denimSkirtVariantSBlue.id,
            storeId: store1.id,
          },
          {
            quantity: 1,
            price: goldNecklaceDefaultVariant.price,
            productVariantId: goldNecklaceDefaultVariant.id,
            storeId: store1.id,
          },
        ],
      },
    },
  });

  // Order 2: John Doe buys an item, shipped to his work address
  const order2 = await prisma.order.create({
    data: {
      total: androidPhoneVariantBlack128.price,
      status: "PENDING",
      buyerId: user1.id,
      addressId: johnsWorkAddress.id, // Link to John's work address
      items: {
        create: [
          {
            quantity: 1,
            price: androidPhoneVariantBlack128.price,
            productVariantId: androidPhoneVariantBlack128.id,
            storeId: store2.id,
          },
        ],
      },
    },
  });

  // Order 3: Jane Smith buys items, shipped to her home address
  const order3 = await prisma.order.create({
    data: {
      total:
        androidPhoneVariantSilver256.price + androidPhoneVariantGreen256.price,
      status: "DELIVERED",
      buyerId: user2.id,
      addressId: janesHomeAddress.id, // Link to Jane's home address
      items: {
        create: [
          {
            quantity: 1,
            price: androidPhoneVariantSilver256.price,
            productVariantId: androidPhoneVariantSilver256.id,
            storeId: store2.id,
          },
          {
            quantity: 1,
            price: androidPhoneVariantGreen256.price,
            productVariantId: androidPhoneVariantGreen256.id,
            storeId: store2.id,
          },
        ],
      },
    },
  });

  console.log("Created orders and order items.");

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
