'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, PlusCircle, Clock, ChevronLeft, ChevronRight, CheckCircle, User } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
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
import type { CalendarEvent as EventType } from '@/lib/types';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatDateSafe } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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


function DateSelector({ selectedDate, onDateSelect }: { selectedDate: Date, onDateSelect: (date: Date) => void }) {
    const dates = useMemo(() => {
        const start = subDays(new Date(), 7);
        return Array.from({ length: 30 }).map((_, i) => addDays(start, i));
    }, []);

    return (
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <div className="flex w-max space-x-2 p-2">
                {dates.map(date => {
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                        <Button
                            key={date.toISOString()}
                            variant={isSelected ? 'default' : 'ghost'}
                            className={cn("flex flex-col h-auto p-3 text-center rounded-lg", isSelected && "shadow-lg")}
                            onClick={() => onDateSelect(date)}
                        >
                            <span className="text-xs font-medium uppercase">{format(date, 'EEE')}</span>
                            <span className="text-2xl font-bold">{format(date, 'd')}</span>
                        </Button>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}


export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
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


  return (
    <div className="flex flex-col gap-6 h-full">
        <header className='flex-shrink-0'>
            <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Team Calendar
            </h1>
            <p className="text-muted-foreground">
            A shared calendar for all team events, deadlines, and key dates.
            </p>
        </header>

        <Card className='flex-shrink-0'>
            <CardHeader className='pb-2'>
                 <div className="flex items-center justify-between">
                    <CardTitle>{format(selectedDate, "eeee, MMMM d")}</CardTitle>
                     <Button variant="outline" size="icon" onClick={() => setSelectedDate(new Date())}>
                        <span className='text-xs font-bold'>Today</span>
                     </Button>
                </div>
            </CardHeader>
            <CardContent>
                <DateSelector selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            </CardContent>
        </Card>

        <div className="flex-grow">
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                     <div>
                        <CardTitle>Daily Agenda</CardTitle>
                        <CardDescription>
                            Events scheduled for {format(selectedDate, "MMMM d")}.
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
                    {/* Mobile View */}
                    <div className="space-y-4 sm:hidden">
                        {isLoading && Array.from({length: 2}).map((_, i) => (
                           <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                        ))}
                        {!isLoading && selectedDayEvents && selectedDayEvents.length > 0 ? (
                            selectedDayEvents.map((event) => (
                                <Card key={event.id}>
                                    <CardHeader>
                                        <CardTitle>{event.title}</CardTitle>
                                        <Badge variant="outline" className={cn("w-fit", categoryColors[event.category])}>
                                            {event.category}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <User className="h-4 w-4 mr-2" />
                                            <span>{event.responsible} at {event.location}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                             !isLoading && (
                                <EmptyState 
                                    icon={CheckCircle}
                                    title="No Events Today"
                                    description="Your schedule is clear. Select another day or add a new event."
                                    className="min-h-0 py-24"
                                />
                            )
                        )}
                    </div>
                    
                    {/* Desktop View */}
                    <div className="hidden sm:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Responsible</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Category</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {isLoading && Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                    </TableRow>
                                ))}
                                {!isLoading && selectedDayEvents && selectedDayEvents.length > 0 ? (
                                    selectedDayEvents.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell className="font-medium">{event.title}</TableCell>
                                            <TableCell>{event.responsible}</TableCell>
                                            <TableCell>{event.location}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("self-center", categoryColors[event.category])}>
                                                    {event.category}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    !isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center">
                                                <EmptyState 
                                                    icon={CheckCircle}
                                                    title="No Events Today"
                                                    description="Your schedule is clear. Select another day or add a new event."
                                                    className="min-h-0"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                             </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
