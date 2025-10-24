"use client";
import { useState } from "react";
import { motion, useMotionValue } from "framer-motion";

export default function SwipeAction({
  label,
  onConfirm,
}: {
  label: string;
  onConfirm: () => void;
}) {
  const x = useMotionValue(0);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="relative bg-gray-200 rounded-full w-full h-12 overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 bg-green-500 text-white rounded-full h-12 flex items-center justify-center px-4"
        drag="x"
        dragConstraints={{ left: 0, right: 280 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.point.x > 200) {
            setConfirmed(true);
            onConfirm();
          } else {
            x.set(0);
          }
        }}
      >
        {confirmed ? "Confirmed" : label}
      </motion.div>
    </div>
  );
}
