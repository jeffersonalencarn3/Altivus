import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)] text-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.12)]",
        secondary:
          "border-white/[0.08] bg-white/[0.05] text-[#A0AEC0]",
        destructive:
          "border-red-500/25 bg-red-500/[0.08] text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.12)]",
        outline: "border-white/[0.08] text-[#A0AEC0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }