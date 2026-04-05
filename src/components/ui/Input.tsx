import { InputHTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {label && (
        <label style={{ fontSize: "14px", fontWeight: 500 }}>{label}</label>
      )}
      <input
        className={cn(
          "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none",
          "focus:border-[#183b66] focus:ring-2 focus:ring-[#183b66]/20",
          className
        )}
        {...props}
      />
    </div>
  );
}