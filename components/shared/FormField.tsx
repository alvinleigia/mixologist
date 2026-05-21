import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

export function FormField({ label, htmlFor, className, children }: FormFieldProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm text-stone-700">
        {label}
      </Label>
      {children}
    </div>
  );
}
