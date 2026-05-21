import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  meta,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold text-stone-900">{title}</h2>
      {description ? <p className="mt-3 text-sm text-stone-600">{description}</p> : null}
      {meta ? <div className="mt-2">{meta}</div> : null}
    </div>
  );
}
