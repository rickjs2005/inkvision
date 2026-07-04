import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

// Tick quadrado com hairline — mais editorial que a pílula default.
const badgeVariants = cva(
  "inline-flex items-center rounded-[4px] border px-2 py-0.5 text-[11px] font-medium tracking-tight",
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary/10 text-primary",
        neutral: "border-border bg-transparent text-muted-foreground",
        success: "border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
        warning: "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        destructive: "border-destructive/25 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
