import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // Create categories
  const categories = await prisma.category.createMany({
    data: [
      { id: uuidv4(), name: "Clothing" },
      { id: uuidv4(), name: "Electronics" },
      { id: uuidv4(), name: "Books" },
    ],
    skipDuplicates: true,
  });

  const categoryClothing = await prisma.category.findFirst({
    where: { name: "Clothing" },
  });
  const categoryElectronics = await prisma.category.findFirst({
    where: { name: "Electronics" },
  });

  // Create users
  const passwordHash = await bcrypt.hash("password123", 10);

  const buyerUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      name: "Alice Buyer",
      email: "alice@example.com",
      password: passwordHash,
      isBuyer: true,
    },
  });

  const sellerUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      name: "Bob Seller",
      email: "bob@example.com",
      password: passwordHash,
      isBuyer: true,
      isSeller: true,
    },
  });

  // Create a store for the seller
  const store = await prisma.store.create({
    data: {
      id: uuidv4(),
      name: "Bob's Store",
      description: "High-quality goods from Bob",
      logo: "https://via.placeholder.com/150",
      userId: sellerUser.id,
    },
  });

  // Add products to the store
  await prisma.product.createMany({
    data: [
      {
        id: uuidv4(),
        name: "Red T-Shirt",
        description: "Comfortable cotton T-shirt",
        price: 19.99,
        stock: 100,
        images: ["https://via.placeholder.com/300"],
        sizes: ["S", "M", "L"],
        colors: ["red"],
        storeId: store.id,
        categoryId: categoryClothing?.id!,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "Bluetooth Headphones",
        description: "Noise-cancelling wireless headphones",
        price: 79.99,
        stock: 50,
        images: ["https://via.placeholder.com/300"],
        sizes: [],
        colors: ["black"],
        storeId: store.id,
        categoryId: categoryElectronics?.id!,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  // Create an order for the buyer
  const product = await prisma.product.findFirst({
    where: { name: "Red T-Shirt" },
  });

  const order = await prisma.order.create({
    data: {
      id: uuidv4(),
      buyerId: buyerUser.id,
      total: 39.98,
      status: "PAID",
      items: {
        create: [
          {
            id: uuidv4(),
            productId: product!.id,
            quantity: 2,
            price: 19.99,
          },
        ],
      },
    },
  });

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
