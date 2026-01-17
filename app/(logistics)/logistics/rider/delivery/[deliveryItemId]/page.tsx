import RiderDeliveryMapPage from "@/components/rider/ActiveDelivery";
import React from "react";

type Props = {
  params: Promise<{
    deliveryItemId: string;
  }>;
};

const DeliveryTrackingPage = async ({ params }: Props) => {
  const { deliveryItemId } = await params;

  return (
    <div>
      <RiderDeliveryMapPage deliveryItemId={deliveryItemId} />
    </div>
  );
};

export default DeliveryTrackingPage;
