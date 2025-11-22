import { cn } from "@/lib/utils";

const variants = {
  default: "border-border text-foreground",
  success: "border-emerald-200 text-emerald-900 bg-emerald-50",
  destructive: "border-destructive/40 text-destructive bg-destructive/10",
} as const;

export function Alert({
  variant = "default",
  className,
  children,
}: {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("rounded-lg border px-4 py-3 text-sm", variants[variant], className)}>{children}</div>;
}
