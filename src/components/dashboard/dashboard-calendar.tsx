
'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlusCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { CalendarEvent as EventType } from '@/lib/types';

const categoryColors: { [key: string]: string } = {
    "Team Meetings": "bg-blue-500/10 text-blue-500 border-blue-500",
    "Field Visits": "bg-green-500/10 text-green-500 border-green-500",
    "Campaigns/Events": "bg-red-500/10 text-red-500 border-red-500",
    "Deadlines": "bg-purple-500/10 text-purple-500 border-purple-500",
    "Social Days": "bg-orange-500/10 text-orange-500 border-orange-500",
};


const eventSchema = z.object({
    title: z.string().min(3, "Title is required."),
    date: z.string().min(1, "Date is required."),
    category: z.enum(["Team Meetings", "Field Visits", "Campaigns/Events", "Deadlines", "Social Days"]),
    location: z.string().min(2, "Location is required."),
    responsible: z.string().min(2, "Responsible person/team is required."),
});

function NewEventForm({ onFormSubmit }: { onFormSubmit: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<z.infer<typeof eventSchema>>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            category: 'Team Meetings',
            date: format(new Date(), 'yyyy-MM-dd')
        },
    });

    const onSubmit = (data: z.infer<typeof eventSchema>) => {
        if (!firestore) return;
        const eventsCollection = collection(firestore, 'events');
        const newEvent = {
            ...data,
            date: Timestamp.fromDate(new Date(data.date)),
            createdAt: serverTimestamp(),
        };
        addDocumentNonBlocking(eventsCollection, newEvent);
        toast({
            title: "Event Added!",
            description: `${data.title} has been added to the calendar.`,
        });
        reset();
        onFormSubmit();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" {...register("title")} placeholder="e.g., RED Campaign Planning" />
                {errors.title && <p className="text-sm text-destructive">{`${errors.title.message}`}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && <p className="text-sm text-destructive">{`${errors.date.message}`}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                 <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(categoryColors).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                />
                {errors.category && <p className="text-sm text-destructive">{`${errors.category.message}`}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" {...register("location")} placeholder="e.g., Youth Centre" />
                    {errors.location && <p className="text-sm text-destructive">{`${errors.location.message}`}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="responsible">Responsible</Label>
                    <Input id="responsible" {...register("responsible")} placeholder="e.g., Dianah & Team" />
                    {errors.responsible && <p className="text-sm text-destructive">{`${errors.responsible.message}`}</p>}
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Event'}
                </Button>
            </DialogFooter>
        </form>
    );
}

export function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'events'), orderBy('date', 'asc'));
  }, [firestore]);

  const { data: events, isLoading } = useCollection<EventType>(eventsQuery);

  const selectedDayEvents = useMemo(() => {
    return events?.filter(event => isSameDay(event.date.toDate(), currentDate)) || [];
  }, [events, currentDate]);


  return (
    <Card className="flex flex-col">
       <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                 <CardTitle className="flex items-center gap-2"><CalendarIcon /> Team Calendar</CardTitle>
                 <CardDescription>
                    Key events, deadlines, and activities.
                </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Add New Calendar Event</DialogTitle>
                      <DialogDescription>Fill in the details for the new event.</DialogDescription>
                  </DialogHeader>
                  <NewEventForm onFormSubmit={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="flex items-center justify-between mb-4">
             <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-headline text-lg font-semibold text-center">
                {format(currentDate, "eeee, MMMM d")}
            </h3>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
        <div className="space-y-3 flex-grow">
            {isLoading && Array.from({length: 2}).map((_, i) => (
                <div key={i} className='p-3 bg-muted rounded-lg space-y-2'>
                    <Skeleton className='h-4 w-3/4' />
                    <Skeleton className='h-4 w-1/2' />
                </div>
            ))}
            {!isLoading && selectedDayEvents && selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-muted rounded-lg">
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
                !isLoading && <div className="flex items-center justify-center h-full text-sm text-muted-foreground pt-8">No events scheduled for this day.</div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
