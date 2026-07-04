import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[transform,box-shadow,background-color,color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform",
  {
    variants: {
      variant: {
        // CTA da marca — vermelhão com sombra de tinta que "levanta" no hover.
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-ink)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        // Ação neutra forte — preenchimento de tinta sólida.
        ink: "bg-foreground text-background hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        outline:
          "border border-foreground/15 bg-transparent hover:border-foreground/35 hover:bg-foreground/[0.04]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-foreground/[0.05]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-ink)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        link: "ink-link px-0 text-foreground",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-sm px-3.5 text-[13px]",
        lg: "h-12 rounded-lg px-8 text-[15px]",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
