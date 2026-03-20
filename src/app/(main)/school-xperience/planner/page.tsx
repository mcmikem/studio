'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  GraduationCap,
  Heart,
  Flower2,
  Droplets,
  Star,
  ClipboardCheck,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import type { SchoolXperience } from '@/lib/types';

const PROGRAMME_COLORS: Record<string, { bg: string; text: string }> = {
  SLF: { bg: 'bg-blue-100', text: 'text-blue-700' },
  RED: { bg: 'bg-pink-100', text: 'text-pink-700' },
  GreenSchools: { bg: 'bg-green-100', text: 'text-green-700' },
  PureWater: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ScheduledEvent = {
  id: string;
  title: string;
  date: any;
  category: string;
  schoolName?: string;
  programmes?: string[];
  responsible?: string;
  location?: string;
};

export default function TermPlannerPage() {
  const firestore = useFirestore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'events'), orderBy('date', 'asc'));
  }, [firestore]);

  const visitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-visits'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore]);

  const { data: events, isLoading: eventsLoading } = useCollection<any>(eventsQuery);
  const { data: visits, isLoading: visitsLoading } = useCollection<any>(visitsQuery);
  const { data: schools } = useCollection<SchoolXperience>(schoolsQuery);

  const allEvents = useMemo(() => {
    const schedule: ScheduledEvent[] = [];

    if (events) {
      events.forEach((e) => {
        if (e.category === 'Field Visits' || e.category === 'Team Meetings' || e.category === 'Campaigns/Events') {
          schedule.push({
            id: e.id,
            title: e.title,
            date: e.date,
            category: e.category,
            schoolName: e.schoolName,
            programmes: e.programmes,
            responsible: e.responsible,
            location: e.location,
          });
        }
      });
    }

    if (visits) {
      visits.forEach((v) => {
        const school = schools?.find((s) => s.id === v.schoolId);
        schedule.push({
          id: v.id,
          title: `Visit: ${v.schoolName || 'School'}`,
          date: v.date,
          category: 'Field Visits',
          schoolName: v.schoolName,
          programmes: v.programmesCovered,
          responsible: v.visitor,
          location: school?.location,
        });
      });
    }

    return schedule;
  }, [events, visits, schools]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) => {
    return allEvents.filter((e) => {
      const eventDate = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
      return isSameDay(eventDate, day);
    });
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Field Visits': return 'bg-green-100 text-green-700 border-green-200';
      case 'Team Meetings': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Campaigns/Events': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={CalendarIcon}
        title="Term Planner"
        description="Calendar view of school visits, training sessions, and events for the current term."
        breadcrumbs={[
          { name: 'Dashboard', href: '/' },
          { name: 'School Xperience', href: '/school-xperience' },
          { name: 'Term Planner', href: '/school-xperience/planner' },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                  <CardDescription>School Xperience term calendar</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-7 gap-px">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
                {days.map((day, i) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        min-h-[72px] sm:min-h-[90px] p-1 sm:p-2 border border-muted/50 text-left transition-all
                        ${isCurrentMonth ? 'bg-background' : 'bg-muted/20'}
                        ${isSelected ? 'ring-2 ring-primary ring-offset-1' : 'hover:bg-muted/30'}
                        ${isToday(day) ? 'font-black' : ''}
                      `}
                    >
                      <span className={`
                        text-xs font-bold block
                        ${isCurrentMonth ? '' : 'text-muted-foreground/50'}
                        ${isToday(day) ? 'text-primary' : ''}
                      `}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((e) => (
                            <div
                              key={e.id}
                              className={`text-[10px] font-bold truncate rounded px-1 py-0.5 ${getCategoryColor(e.category)}`}
                              title={e.title}
                            >
                              {e.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] text-muted-foreground text-center">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" />
                  Field Visits
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" />
                  Team Meetings
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />
                  Campaigns/Events
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b-lg">
              <CardTitle className="text-base font-black">
                {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a day'}
              </CardTitle>
              {selectedDate && (
                <CardDescription>
                  {getEventsForDay(selectedDate).length} event{getEventsForDay(selectedDate).length !== 1 ? 's' : ''}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {!selectedDate ? (
                <p className="text-sm text-muted-foreground text-center py-8">Click a day to see events</p>
              ) : eventsLoading || visitsLoading ? (
                <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm font-bold text-muted-foreground">No events</p>
                  <p className="text-xs text-muted-foreground">Nothing scheduled for this day</p>
                </div>
              ) : (
                selectedDayEvents.map((event) => (
                  <div key={event.id} className="border-lg rounded-xl p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm line-clamp-1">{event.title}</p>
                      <Badge className={`text-xs font-bold shrink-0 ${getCategoryColor(event.category)}`}>
                        {event.category === 'Field Visits' ? <ClipboardCheck className="h-3 w-3 mr-1" /> : null}
                        {event.category}
                      </Badge>
                    </div>
                    {event.schoolName && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {event.schoolName}
                      </p>
                    )}
                    {event.location && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                    )}
                    {event.responsible && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3" />
                        {event.responsible}
                      </p>
                    )}
                    {event.programmes && event.programmes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {event.programmes.map((p) => (
                          <Badge key={p} className={`text-xs font-bold ${PROGRAMME_COLORS[p]?.bg} ${PROGRAMME_COLORS[p]?.text}`}>
                            {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="pt-1">
                      <Button size="sm" variant="outline" className="w-full h-7 rounded-lg text-xs font-bold" asChild>
                        <Link href="/calendar">
                          View in Calendar
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-lg shadow-comic-sm mt-4">
            <CardContent className="pt-4 space-y-2">
              <Button asChild className="w-full btn-omuto h-10 rounded-xl text-xs font-black uppercase tracking-widest">
                <Link href="/calendar">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Full Calendar
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-10 rounded-xl text-xs font-bold">
                <Link href="/school-xperience/log-visit">
                  <Plus className="mr-2 h-4 w-4" />
                  Log Visit
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
