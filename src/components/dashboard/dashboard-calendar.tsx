'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { operationalPlanEvents } from '@/lib/data';
import { format, isSameDay, isSameMonth } from 'date-fns';

export function DashboardCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 9, 1));

  const selectedDayEvents = date
    ? operationalPlanEvents.filter((event) => isSameDay(event.date, date))
    : [];

  const modifiers = {
    event: operationalPlanEvents.map((event) => event.date),
  };

  const modifiersStyles = {
    event: {
      border: '2px solid hsl(var(--primary))',
      borderRadius: '50%',
    },
  };
  
  const monthEvents = date ? operationalPlanEvents.filter(event => isSameMonth(event.date, date)) : [];


  return (
    <Card>
      <CardHeader>
        <CardTitle>October 2025 Plan</CardTitle>
        <CardDescription>
          Key dates and activities for the month. Click a day to see events.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-6">
        <div className="flex justify-center">
            <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            defaultMonth={new Date(2025, 9, 1)}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
            />
        </div>
        <div className="flex-1 space-y-4">
            <h3 className="font-headline text-lg font-semibold">
                {date ? format(date, "MMMM d, yyyy") : 'Select a date'}
            </h3>
            {selectedDayEvents.length > 0 ? (
                <ul className="space-y-3">
                {selectedDayEvents.map((event) => (
                    <li key={event.title} className="p-3 bg-muted rounded-lg">
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No events for this day.</p>
            )}

            <div className="pt-4">
                <h3 className="font-headline text-lg font-semibold mb-2">Upcoming this Month</h3>
                <div className="space-y-2">
                    {monthEvents.length > 0 ? monthEvents.map(event => (
                        <div key={event.title} className="flex items-center justify-between text-sm">
                            <span>{event.title}</span>
                            <Badge variant="outline">{format(event.date, "MMM d")}</Badge>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">No events scheduled this month.</p>}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
