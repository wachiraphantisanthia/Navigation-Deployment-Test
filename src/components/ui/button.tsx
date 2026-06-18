import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-gold hover:-translate-y-0.5 hover:bg-primary/90",
        secondary: "border border-border bg-card text-foreground hover:bg-secondary",
        default: "bg-primary text-primary-foreground shadow-gold hover:bg-primary/90",
        outline: "border border-border bg-card text-foreground hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        dark: "bg-foreground text-background hover:bg-foreground/90",
        link: "min-h-0 p-0 text-primary underline-offset-4 hover:underline",
      },
      size: { default: "min-h-12", sm: "min-h-9 px-3", lg: "min-h-14 px-7", touch: "min-h-16 px-7 text-base", icon: "size-12 p-0" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, asChild, ...props }, ref) {
  const Component = asChild ? Slot : "button";
  return <Component ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});