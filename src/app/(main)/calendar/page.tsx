'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    format, 
    isSameDay, 
    addDays, 
    subDays, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    addMonths, 
    subMonths,
    isSameMonth,
    isToday
} from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, PlusCircle, ChevronLeft, ChevronRight, MapPin, User, Clock } from 'lucide-react';
import { useCollection, useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
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
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

const categoryColors: { [key: string]: string } = {
    "Team Meetings": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    "Field Visits": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    "Campaigns/Events": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    "Deadlines": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    "Social Days": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    useEffect(() => {
        setCurrentMonth(new Date());
        setSelectedDate(new Date());
    }, []);

    const eventsQuery = useMemoFirebase((db) => {
        // Ideally filter by month range here, but getting all and filtering client side is ok for small datasets
        return query(collection(db, 'events'), orderBy('date', 'asc'));
    }, []);

    const { data: events, isLoading } = useCollection<EventType>(eventsQuery);

    const calendarDays = useMemo(() => {
        if (!currentMonth) return [];
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const getEventsForDay = (day: Date) => {
        if (!events) return [];
        return events.filter(event => {
            const eventDate = event.date instanceof Timestamp ? event.date.toDate() : new Date(event.date);
            return isSameDay(eventDate, day);
        });
    };

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setIsSheetOpen(true);
    };

    if (!currentMonth) return <Skeleton className="h-96 w-full" />;

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col gap-6 h-full">
        <header className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                <CalendarIcon className="h-8 w-8" />
                Team Calendar
                </h1>
                <p className="text-muted-foreground">
                Plan and track upcoming activities.
                </p>
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                 <div className="flex items-center bg-card border rounded-md">
                     <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                         <ChevronLeft className="h-4 w-4" />
                     </Button>
                     <span className="w-32 text-center font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
                     <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                         <ChevronRight className="h-4 w-4" />
                     </Button>
                 </div>
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Event</DialogTitle>
                            <DialogDescription>Create a new event for the calendar.</DialogDescription>
                        </DialogHeader>
                        <NewEventForm onFormSubmit={() => setIsDialogOpen(false)} defaultDate={selectedDate || new Date()} />
                    </DialogContent>
                </Dialog>
            </div>
        </header>

        <Card className="flex-grow flex flex-col overflow-hidden">
            {/* Calendar Header Row */}
            <div className="grid grid-cols-7 border-b text-center text-sm font-medium bg-muted/40">
                {weekDays.map(day => (
                    <div key={day} className="py-2">{day}</div>
                ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="flex-grow grid grid-cols-7 grid-rows-5 md:grid-rows-6">
                {calendarDays.map((day, dayIdx) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDayToday = isToday(day);

                    return (
                        <div 
                            key={day.toString()} 
                            onClick={() => handleDayClick(day)}
                            className={cn(
                                "border-b border-r p-1 sm:p-2 min-h-[90px] sm:min-h-[110px] relative transition-colors hover:bg-muted/30 cursor-pointer flex flex-col gap-1",
                                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                                isDayToday && "bg-primary/5"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                    isDayToday && "bg-primary text-primary-foreground"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>
                            
                            <div className="flex-grow flex flex-col gap-1 overflow-hidden mt-1">
                                {dayEvents.slice(0, 3).map(event => (
                                    <div 
                                        key={event.id} 
                                        className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-sm truncate font-medium border border-l-2",
                                            categoryColors[event.category] || "bg-gray-100 border-gray-200"
                                        )}
                                        title={event.title}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground pl-1">
                                        + {dayEvents.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent>
                <SheetHeader className="mb-6">
                    <SheetTitle>{selectedDate ? format(selectedDate, "EEEE, MMMM do") : 'Event Details'}</SheetTitle>
                    <SheetDescription>
                         Scheduled events for this day.
                    </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-4">
                     {selectedDate && getEventsForDay(selectedDate).length > 0 ? (
                        getEventsForDay(selectedDate).map(event => (
                            <div key={event.id} className="border rounded-lg p-4 space-y-3 relative overflow-hidden">
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1", categoryColors[event.category]?.split(' ')[0].replace('bg-', 'bg-') || "bg-gray-200")}></div>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold">{event.title}</h4>
                                    <Badge variant="outline" className={cn("text-xs", categoryColors[event.category])}>{event.category}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> {event.location}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-3 w-3" /> {event.responsible}
                                    </div>
                                </div>
                            </div>
                        ))
                     ) : (
                         <div className="text-center py-10 text-muted-foreground">
                            <p>No events scheduled.</p>
                            <Button variant="link" onClick={() => { setIsSheetOpen(false); setIsDialogOpen(true); }}>Add Event</Button>
                         </div>
                     )}
                </div>
            </SheetContent>
        </Sheet>
    </div>
  );
}
