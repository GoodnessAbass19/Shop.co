import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent text-green-600 bg-green-100 shadow hover:text-green-700",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent text-red-600 bg-red-100 shadow hover:text-red-700",
        outline: "text-foreground",
        success:
          "border-transparent text-blue-600 bg-blue-100 shadow hover:text-blue-700",
        warning:
          "border-transparent text-yellow-600 bg-yellow-100 shadow hover:text-yellow-300",
        info: "border-transparent text-purple-600 bg-purple-100 shadow hover:text-purple-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
