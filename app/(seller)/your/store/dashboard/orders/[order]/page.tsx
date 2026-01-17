import OrderDetailsPage from "@/components/seller/OrderDetails";
import { Metadata } from "next";
import React from "react";

interface Props {
  params: Promise<{ order: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ order: string }>;
}): Promise<Metadata> {
  const { order } = await params;
  return {
    title: `Order details: ${order}`,
  };
}

const OrderDetails = async ({
  params,
}: {
  params: Promise<{ order: string }>;
}) => {
  const { order } = await params;
  return (
    <div>
      <OrderDetailsPage params={order} />
    </div>
  );
};

export default OrderDetails;
