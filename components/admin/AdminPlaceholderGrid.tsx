import { Card, CardContent, CardHeader } from "@/components/ui/card";

type AdminPlaceholderGridProps = {
  cards: Array<{
    title: string;
    description: string;
    status: string;
  }>;
};

export function AdminPlaceholderGrid({ cards }: AdminPlaceholderGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="rounded-xl border-stone-200 bg-white">
          <CardHeader className="px-5 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              {card.status}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-stone-950">{card.title}</h3>
          </CardHeader>
          <CardContent className="px-5 pb-5 text-sm text-stone-600">
            {card.description}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
