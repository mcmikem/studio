import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { statsCards } from '@/lib/data';

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {statsCards.map((card) => (
        <Card key={card.title} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
