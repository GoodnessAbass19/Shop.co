import { EditDiscountForm } from "@/components/seller/EditDiscountForm";

interface EditDiscountPageProps {
  params: Promise<{
    discountId: string;
  }>;
}

export default async function EditDiscountPage({ params }: EditDiscountPageProps) {
  const { discountId } = await params;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <EditDiscountForm discountId={discountId} />
    </div>
  );
}
