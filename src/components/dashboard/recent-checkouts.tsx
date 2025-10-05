import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { recentCheckouts } from '@/lib/data';

export function RecentCheckouts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Check-outs</CardTitle>
        <CardDescription>
          Latest updates from the team at the end of the day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentCheckouts.map((checkout) => (
          <div key={checkout.name} className="flex items-start gap-4">
            <Avatar className="h-9 w-9 border" data-ai-hint="person avatar">
              <AvatarImage src={checkout.avatar} alt="Avatar" />
              <AvatarFallback>{checkout.role}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">{checkout.name}</p>
              <p className="text-sm text-muted-foreground">{checkout.task}</p>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">{checkout.time}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
