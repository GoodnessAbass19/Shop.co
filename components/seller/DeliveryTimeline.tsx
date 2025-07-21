interface DeliveryTimelineProps {
  deliveryStatus: "PENDING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";
  timestamps?: {
    assignedAt?: Date;
    deliveredAt?: Date;
  };
}

const statusLabels = {
  PENDING: "Order Placed",
  ASSIGNED: "Assigned to Rider",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  FAILED: "Delivery Failed",
};

export function DeliveryTimeline({ deliveryStatus }: DeliveryTimelineProps) {
  const steps = [
    { label: "Order Placed", status: "PENDING" },
    { label: "Assigned to Rider", status: "OUT_FOR_DELIVERY" },
    { label: "In Transit", status: "OUT_FOR_DELIVERY" },
    { label: "Delivered", status: "DELIVERED" },
  ];

  const currentIndex = steps.findIndex((s) => s.status === deliveryStatus);

  return (
    <ol className="relative border-l border-gray-300 ml-4">
      {steps.map((step, index) => {
        const isComplete = index <= currentIndex;
        return (
          <li key={step.status} className="mb-6 ml-6">
            <span
              className={`absolute w-3 h-3 rounded-full -left-1.5 ${
                isComplete ? "bg-green-600" : "bg-gray-400"
              }`}
            />
            <p className="text-sm font-semibold">
              {step.label}
              {index === currentIndex && " (Current)"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
