import { cva } from "class-variance-authority";

export const navLink = cva(
  "inline-flex items-center text-white font-medium transition-all border-b-2 border-transparent hover:opacity-80 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:rounded-sm " +
    "px-1.5 py-2",
  {
    variants: {
      active: {
        true: "border-white",
        false: "",
      },
      size: {
        md: "text-base",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      active: false,
      size: "md",
    },
  }
);
