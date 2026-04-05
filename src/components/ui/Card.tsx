import { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white shadow-md p-5 border border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}