import type { ReactNode } from "react";

const STYLES = {
  error: "bg-red-50 border-red-200 text-red-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function Alert({ variant, children }: { variant: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div className={`px-4 py-3 rounded-lg border text-sm mb-4 ${STYLES[variant]}`} role={variant === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
