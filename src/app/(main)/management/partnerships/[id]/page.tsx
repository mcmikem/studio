
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCollection, useDoc, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Partnership, Meeting, HealthCheck } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Handshake, Mail, Phone, User, ArrowLeft, Calendar, FileText, PlusCircle, HeartPulse, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { formatDateSafe } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addMonths } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Negotiation": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "Prospecting": "border-blue-500 bg-blue-500/10 text-blue-500",
    "Stalled": "border-red-500 bg-red-500/10 text-red-500",
};

const meetingSchema = z.object({
  date: z.string().min(1, 'Meeting date is required.'),
  attendees: z.string().min(3, 'Please list attendees.'),
  type: z.enum(["Exploration", "Proposal", "Progress", "Problem", "Renewal"]),
  decisions: z.string().optional(),
  nextSteps: z.string().min(3, 'Next steps are required.'),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

const healthCheckSchema = z.object({
  communication: z.coerce.number().min(1).max(5),
  delivery: z.coerce.number().min(1).max(5),
  alignment: z.coerce.number().min(1).max(5),
  value: z.coerce.number().min(1).max(5),
  issues: z.string().optional(),
  recommendation: z.enum(["Continue", "Improve", "Pause", "Terminate"]),
  nextReviewDate: z.string().min(1, "Next review date is required."),
});
type HealthCheckFormData = z.infer<typeof healthCheckSchema>;


function HealthCheckForm({ partner, onFormSubmit }: { partner: Partnership; onFormSubmit: () => void }) {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<HealthCheckFormData>({
    resolver: zodResolver(healthCheckSchema),
    defaultValues: {
      communication: 3, delivery: 3, alignment: 3, value: 3,
      recommendation: "Continue",
      nextReviewDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: HealthCheckFormData) => {
    if (!firestore || !user || !profile) return;
    const healthCheckCollection = collection(firestore, 'partnerships', partner.id, 'healthChecks');
    const partnerRef = doc(firestore, 'partnerships', partner.id);
    
    const newHealthCheck: Omit<HealthCheck, 'id'> = {
      partnerId: partner.id,
      partnerName: partner.name,
      checkDate: serverTimestamp() as Timestamp,
      createdAt: serverTimestamp() as Timestamp,
      checkedBy: profile.name,
      ...data,
    };
    
    // Determine overall health status
    const avgRating = (data.communication + data.delivery + data.alignment + data.value) / 4;
    let newHealthStatus: Partnership['health'] = 'Strong';
    if (avgRating < 2.5) newHealthStatus = 'At Risk';
    else if (avgRating < 4) newHealthStatus = 'Needs Attention';
    
    try {
      await addDocumentNonBlocking(healthCheckCollection, newHealthCheck);
      await updateDocumentNonBlocking(partnerRef, { health: newHealthStatus });
      toast({ title: "Health Check Logged!", description: `The health status for ${partner.name} has been updated.` });
      onFormSubmit();
    } catch (e) {
      console.error("Error logging health check:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the health check.' });
    }
  };

  const StarRating = ({ name }: { name: keyof HealthCheckFormData }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <label key={star}>
          <input type="radio" value={star} {...register(name)} className="sr-only" />
          <Star className={`cursor-pointer h-6 w-6 `} />
        </label>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center"><Label>Communication</Label><StarRating name="communication" /></div>
        <div className="flex justify-between items-center"><Label>Delivery on Promises</Label><StarRating name="delivery" /></div>
        <div className="flex justify-between items-center"><Label>Strategic Alignment</Label><StarRating name="alignment" /></div>
        <div className="flex justify-between items-center"><Label>Value Provided</Label><StarRating name="value" /></div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="issues">Issues or Concerns</Label>
        <Textarea id="issues" {...register("issues")} placeholder="Any challenges or friction points?" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="recommendation">Recommendation</Label>
        <Select defaultValue="Continue" onValueChange={(value) => setValue('recommendation', value as any)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="Continue">Continue</SelectItem>
                <SelectItem value="Improve">Improve</SelectItem>
                <SelectItem value="Pause">Pause</SelectItem>
                <SelectItem value="Terminate">Terminate</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nextReviewDate">Next Review Date</Label>
        <Input id="nextReviewDate" type="date" {...register("nextReviewDate")} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Health Check
        </Button>
      </DialogFooter>
    </form>
  );
}

function MeetingLogForm({ partner, onFormSubmit }: { partner: Partnership, onFormSubmit: () => void }) {
    const { user } = useUser();
    const { profile } = useUserProfile(user);
    const firestore = useFirestore();
    const { toast } = useToast();

    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<MeetingFormData>({
        resolver: zodResolver(meetingSchema),
        defaultValues: {
            date: format(new Date(), 'yyyy-MM-dd'),
            type: 'Progress',
            attendees: `${profile?.name || ''}, ${partner.contactPerson}`,
        },
    });

    const onSubmit = async (data: MeetingFormData) => {
        if (!firestore) return;
        const meetingCollection = collection(firestore, 'partnerships', partner.id, 'meetings');
        const partnerRef = doc(firestore, 'partnerships', partner.id);
        
        const newMeeting = {
            ...data,
            partnerId: partner.id,
            partnerName: partner.name,
            date: Timestamp.fromDate(new Date(data.date)),
            createdAt: serverTimestamp()
        };

        try {
            await addDocumentNonBlocking(meetingCollection, newMeeting);
            await updateDocumentNonBlocking(partnerRef, {
                lastContacted: serverTimestamp(),
                nextStep: data.nextSteps,
            });

            toast({ title: "Meeting Logged!", description: "The interaction has been saved to the partner's timeline." });
            reset();
            onFormSubmit();
        } catch (e) {
            console.error("Error logging meeting:", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the meeting log.' });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="date">Meeting Date</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && <p className="text-sm text-destructive">{`${errors.date.message}`}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="attendees">Attendees</Label>
                <Input id="attendees" {...register("attendees")} placeholder="e.g., McMike, Dianah, Sarah K." />
                 {errors.attendees && <p className="text-sm text-destructive">{`${errors.attendees.message}`}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="type">Meeting Type</Label>
                 <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Exploration">Exploration</SelectItem>
                            <SelectItem value="Proposal">Proposal</SelectItem>
                            <SelectItem value="Progress">Progress</SelectItem>
                            <SelectItem value="Problem">Problem</SelectItem>
                            <SelectItem value="Renewal">Renewal</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="decisions">Decisions Made (Optional)</Label>
                <Textarea id="decisions" {...register("decisions")} placeholder="e.g., Agreed on joint event in Q1." />
            </div>
             <div className="space-y-2">
                <Label htmlFor="nextSteps">Next Steps</Label>
                <Textarea id="nextSteps" {...register("nextSteps")} placeholder="e.g., Dianah to send draft MoU by Friday." />
                {errors.nextSteps && <p className="text-sm text-destructive">{`${errors.nextSteps.message}`}</p>}
            </div>
             <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Meeting Log
                </Button>
            </DialogFooter>
        </form>
    );
}

function ActivityTimeline({ partnerId }: { partnerId: string }) {
    const firestore = useFirestore();

    const meetingsQuery = useMemoFirebase(() => {
        if (!firestore || !partnerId) return null;
        return query(
            collection(firestore, 'partnerships', partnerId, 'meetings'),
            orderBy('date', 'desc')
        );
    }, [firestore, partnerId]);

    const { data: meetings, isLoading } = useCollection<Meeting>(meetingsQuery);
    
    if (isLoading) {
        return <Skeleton className="h-40 w-full" />
    }

    if (!meetings || meetings.length === 0) {
        return (
             <EmptyState
                icon={FileText}
                title="No Activity Logged"
                description="Log your first meeting or interaction to start building the timeline."
                className="min-h-0 py-10"
              />
        )
    }

    return (
        <div className="space-y-6">
            {meetings.map(meeting => (
                 <div key={meeting.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                           <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="h-full w-px bg-border"></div>
                    </div>
                    <div>
                        <p className="font-semibold">{meeting.type} Meeting - {formatDateSafe(meeting.date, 'dateOnly')}</p>
                        <p className="text-sm text-muted-foreground">Next Step: {meeting.nextSteps}</p>
                    </div>
                 </div>
            ))}
        </div>
    )
}

export default function PartnerProfilePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();
  const [isLogMeetingOpen, setIsLogMeetingOpen] = useState(false);
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);


  const partnerDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'partnerships', id);
  }, [firestore, id]);
  
  const { data: partner, isLoading } = useDoc<Partnership>(partnerDocRef);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!partner) {
    return (
      <div>
        <Button asChild variant="outline">
          <Link href="/management/partnerships"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Partnerships</Link>
        </Button>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Partner Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested partner could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Button asChild variant="outline">
                <Link href="/management/partnerships"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Partnerships</Link>
            </Button>
            <div className="flex gap-2">
                <Dialog open={isHealthCheckOpen} onOpenChange={setIsHealthCheckOpen}>
                    <DialogTrigger asChild>
                         <Button variant="secondary">
                            <HeartPulse className="mr-2 h-4 w-4" />
                            Health Check
                        </Button>
                    </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Partnership Health Check: {partner.name}</DialogTitle>
                            <DialogDescription>Rate the partnership across key indicators.</DialogDescription>
                        </DialogHeader>
                        <HealthCheckForm partner={partner} onFormSubmit={() => setIsHealthCheckOpen(false)} />
                    </DialogContent>
                </Dialog>
                <Dialog open={isLogMeetingOpen} onOpenChange={setIsLogMeetingOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Log Meeting
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Log Interaction with {partner.name}</DialogTitle>
                            <DialogDescription>Record the key outcomes and next steps from your meeting.</DialogDescription>
                        </DialogHeader>
                        <MeetingLogForm partner={partner} onFormSubmit={() => setIsLogMeetingOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Handshake className="h-7 w-7" /> {partner.name}
                        </CardTitle>
                        <CardDescription>{partner.type} Partner</CardDescription>
                    </div>
                    <Badge variant="outline" className={statusColors[partner.status]}>{partner.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Contact Information</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><p>{partner.contactPerson} ({partner.contactRole || 'Primary Contact'})</p></div>
                                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${partner.contactEmail}`} className="text-primary hover:underline">{partner.contactEmail}</a></div>
                                {partner.contactPhone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><p>{partner.contactPhone}</p></div>}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Focus Areas</h3>
                            <div className="flex flex-wrap gap-2">
                                {partner.focusAreas?.map(area => <Badge key={area} variant="secondary">{area}</Badge>)}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">What They Offer</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {partner.offers?.map(offer => <li key={offer}>{offer}</li>)}
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">What We Offer</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {partner.receives?.map(rec => <li key={rec}>{rec}</li>)}
                            </ul>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Initial Assessment</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Strategic Fit</p>
                                <p className="text-xl font-bold">{partner.strategicFit || 'N/A'}/5</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Resource Potential</p>
                                <p className="text-xl font-bold">{partner.resourcePotential || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Risk Level</p>
                                <p className="text-xl font-bold">{partner.riskLevel || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Priority</p>
                                <p className="text-xl font-bold">{partner.priority || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                   <ActivityTimeline partnerId={partner.id} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
