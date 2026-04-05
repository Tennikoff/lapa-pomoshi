import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/src/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-5 py-3 rounded-full font-medium transition-all duration-200",
        variant === "primary" && "bg-[#f1ab95] text-white hover:bg-[#e5957b]",
        variant === "secondary" && "bg-[#183b66] text-white hover:opacity-90",
        variant === "outline" &&
          "border-2 border-[#183b66] text-[#183b66] bg-white hover:bg-[#f3f7fb]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}