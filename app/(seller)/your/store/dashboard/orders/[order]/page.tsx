import OrderDetailsPage from "@/components/seller/OrderDetails";
import { Metadata } from "next";
import React from "react";

type Params = { order: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { order } = await params;
  return {
    title: `Order details: ${order}`,
  };
}

const OrderDetails = async ({ params }: { params: Params }) => {
  const { order } = await params;
  return (
    <div>
      <OrderDetailsPage params={order} />
    </div>
  );
};

export default OrderDetails;
