'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { operationalPlanEvents } from '@/lib/data';
import { format, isSameDay, isSameMonth } from 'date-fns';

export function DashboardCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 9, 10));

  const selectedDayEvents = date
    ? operationalPlanEvents.filter((event) => isSameDay(event.date, date))
    : [];

  const modifiers = {
    event: operationalPlanEvents.map((event) => event.date),
  };

  const modifiersStyles = {
    event: {
      border: '2px solid hsl(var(--accent))',
      borderRadius: '50%',
    },
  };
  
  const monthEvents = date ? operationalPlanEvents.filter(event => isSameMonth(event.date, date)) : [];


  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>
          Key dates and activities for the current month.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
        <div className="mt-4 space-y-2">
            <h3 className="font-headline text-lg font-semibold">
                Events for {date ? format(date, "MMMM d") : 'the month'}:
            </h3>
            {selectedDayEvents.length > 0 ? (
                <ul className="space-y-3">
                {selectedDayEvents.map((event) => (
                    <li key={event.title} className="p-3 bg-muted rounded-lg">
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.responsible} - {event.location}</p>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground pt-2">No events scheduled for this day.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
