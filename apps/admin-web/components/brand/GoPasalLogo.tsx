import { cn } from "@/lib/cn";

export function GoPasalLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/logo.png"
        alt="GoPasal Logo"
        className="h-11 w-11 rounded-xl object-contain drop-shadow-md"
      />
      <span className="font-display text-2xl font-bold tracking-tight text-white">GoPasal</span>
    </div>
  );
}
