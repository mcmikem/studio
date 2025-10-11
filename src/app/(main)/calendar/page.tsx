'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { CalendarEvent as EventType } from '@/lib/types';
import { EmptyState } from '@/components/ui/empty-state';

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

function NewEventForm({ onFormSubmit, defaultDate }: { onFormSubmit: () => void, defaultDate?: Date }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<z.infer<typeof eventSchema>>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            category: 'Team Meetings',
            date: format(defaultDate || new Date(), 'yyyy-MM-dd')
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


export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const firestore = useFirestore();

    const eventsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'events'), orderBy('date', 'asc'));
    }, [firestore]);

    const { data: events, isLoading } = useCollection<EventType>(eventsQuery);

    const selectedDayEvents = useMemo(() => {
        return events?.filter(event => isSameDay(event.date.toDate(), selectedDate)) || [];
    }, [events, selectedDate]);

    const eventDays = useMemo(() => {
        return events?.map(event => event.date.toDate()) || [];
    }, [events]);


  return (
    <div className="flex flex-col gap-6">
        <header>
            <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Team Calendar
            </h1>
            <p className="text-muted-foreground">
            A shared calendar for all team events, deadlines, and key dates.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                         <div>
                            <CardTitle>Upcoming Events</CardTitle>
                            <CardDescription>
                                Events scheduled for {format(selectedDate, "eeee, MMMM d")}.
                            </CardDescription>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Event
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Calendar Event</DialogTitle>
                                    <DialogDescription>Fill in the details for the new event.</DialogDescription>
                                </DialogHeader>
                                <NewEventForm onFormSubmit={() => setIsDialogOpen(false)} defaultDate={selectedDate} />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                             {isLoading && Array.from({length: 2}).map((_, i) => (
                                <div key={i} className='p-4 bg-muted rounded-lg space-y-2'>
                                    <Skeleton className='h-5 w-3/4' />
                                    <Skeleton className='h-4 w-1/2' />
                                </div>
                            ))}
                             {!isLoading && selectedDayEvents && selectedDayEvents.length > 0 ? (
                                selectedDayEvents.map((event) => (
                                    <div key={event.id} className="p-4 bg-muted/50 rounded-lg border">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold">{event.title}</p>
                                                <p className="text-sm text-muted-foreground">{event.responsible} at {event.location}</p>
                                            </div>
                                            <Badge variant="outline" className={categoryColors[event.category]}>
                                                {event.category}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !isLoading && (
                                    <EmptyState 
                                        icon={CalendarIcon}
                                        title="No Events Today"
                                        description="There are no events scheduled for this day. Select another day or add a new event."
                                        className="min-h-0 py-16"
                                    />
                                )
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1">
                <Card>
                    <CardContent className="p-0 sm:p-4">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            className="w-full"
                            modifiers={{ events: eventDays }}
                            modifiersClassNames={{
                                events: "bg-primary/20 text-primary rounded-full",
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
