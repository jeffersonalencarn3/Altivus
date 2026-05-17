import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-35 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#14B8D4] via-[#0FA8C2] to-[#6D56E8] text-[#03070F] font-bold shadow-[0_0_12px_rgba(20,184,212,0.30),0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_0_18px_rgba(20,184,212,0.46),0_6px_20px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 active:scale-[0.96] active:shadow-[0_0_6px_rgba(20,184,212,0.22)]",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/18 hover:border-red-400/40 hover:text-red-300 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(239,68,68,0.25)] active:scale-[0.96]",
        outline:
          "border border-white/10 bg-white/[0.03] text-[#A0AEC0] hover:bg-white/[0.07] hover:border-white/20 hover:text-white hover:-translate-y-0.5 active:scale-[0.96]",
        secondary:
          "bg-white/[0.05] text-[#A0AEC0] border border-white/8 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:scale-[0.96]",
        ghost: "text-[#A0AEC0] hover:bg-white/[0.06] hover:text-white active:scale-[0.96]",
        link: "text-[#00D4FF] underline-offset-4 hover:underline hover:text-[#33DDFF]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }