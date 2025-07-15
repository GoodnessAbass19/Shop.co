import { EditDiscountForm } from "@/components/seller/EditDiscountForm";

interface EditDiscountPageProps {
  params: {
    discountId: string;
  };
}

export default function EditDiscountPage({ params }: EditDiscountPageProps) {
  const { discountId } = params;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <EditDiscountForm discountId={discountId} />
    </div>
  );
}
