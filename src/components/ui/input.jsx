import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-xl border px-3 py-1 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/40 focus-visible:border-[#00D4FF]/50 hover:border-white/18 disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.1)',
        color: '#FFFFFF',
        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.3)',
      }}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }