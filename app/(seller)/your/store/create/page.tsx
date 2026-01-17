import Form from "@/components/store/create-store-form";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CreateStorePage() {
  const user = await getCurrentUser();
  let userHasStore = false;
  if (user) {
    const store = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (store) {
      userHasStore = true;
      redirect("/your/store/dashboard"); // Use redirect for server components
    }
  }

  return (
    <div className="bg-[#f5f5f5] min-h-screen flex items-center justify-center p-4">
      <Form />
    </div>
  );
}
