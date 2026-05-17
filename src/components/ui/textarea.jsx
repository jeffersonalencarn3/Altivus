import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-xl border bg-white/4 px-3 py-2 text-sm shadow-sm transition-all duration-200 placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF]/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }