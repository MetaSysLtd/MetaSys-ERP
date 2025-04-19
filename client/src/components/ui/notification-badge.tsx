import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  variant?: "primary" | "destructive" | "secondary";
  max?: number;
  showZero?: boolean;
}

export function NotificationBadge({ 
  count, 
  className, 
  variant = "primary",
  max = 99,
  showZero = false
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();
  
  const variantClasses = {
    primary: "bg-[#2170dd] text-white",
    destructive: "bg-red-500 text-white",
    secondary: "bg-gray-500 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-medium rounded-full",
        variantClasses[variant],
        className
      )}
    >
      {displayCount}
    </span>
  );
}