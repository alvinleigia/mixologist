import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: "warm" | "dark";
};

const shellVariants = {
  warm:
    "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_38%),linear-gradient(180deg,_#fff8ef_0%,_#f8f2ea_55%,_#f4ede4_100%)] text-stone-900",
  dark:
    "min-h-screen bg-[linear-gradient(180deg,_#1c1917_0%,_#292524_45%,_#44403c_100%)] text-stone-50",
} as const;

export function AppShell({
  children,
  className,
  contentClassName,
  variant = "warm",
}: AppShellProps) {
  return (
    <main className={cn(shellVariants[variant], "px-4 py-10", className)}>
      <div className={cn("mx-auto max-w-6xl", contentClassName)}>{children}</div>
    </main>
  );
}
