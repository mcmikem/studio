'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { operationalPlanEvents } from '@/lib/data';
import { format, isSameDay } from 'date-fns';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';

const categoryColors: { [key: string]: string } = {
    "Team Meetings": "bg-blue-500/10 text-blue-500 border-blue-500",
    "Field Visits": "bg-green-500/10 text-green-500 border-green-500",
    "Campaigns/Events": "bg-red-500/10 text-red-500 border-red-500",
    "Deadlines": "bg-purple-500/10 text-purple-500 border-purple-500",
    "Social Days": "bg-orange-500/10 text-orange-500 border-orange-500",
};

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
      border: '2px solid hsl(var(--primary))',
      borderRadius: '50%',
    },
  };

  return (
    <Card className="flex flex-col">
       <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                 <CardTitle>📅 This Week at Omuto</CardTitle>
                 <CardDescription>
                    Key events, deadlines, and activities.
                </CardDescription>
            </div>
            <Button variant="ghost" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Event
            </Button>
        </div>
      </CardHeader>
      <div className="flex flex-col lg:flex-row flex-grow">
        <div className="flex-grow p-6 pt-0">
            <h3 className="font-headline text-lg font-semibold mb-4">
                Events for {date ? format(date, "MMMM d") : 'the month'}:
            </h3>
            <div className="space-y-3">
                {selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map((event) => (
                        <div key={event.title} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold">{event.title}</p>
                                    <p className="text-sm text-muted-foreground">{event.responsible} - {event.location}</p>
                                </div>
                                <Badge variant="outline" className={categoryColors[event.category]}>
                                    {event.category}
                                </Badge>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground pt-2">No events scheduled for this day.</p>
                )}
            </div>
        </div>
       <div className="border-t lg:border-t-0 lg:border-l p-2 flex items-center justify-center">
         <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            defaultMonth={new Date(2025, 9, 1)}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md"
            />
      </div>
      </div>
    </Card>
  );
}
