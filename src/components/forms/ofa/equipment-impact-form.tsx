'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const impactTrackerSchema = z.object({
  teamId: z.string().min(1, 'Please select a team.'),
  item: z.string().min(2, 'Item name is required.'),
  dateGiven: z.string().min(1, 'Date given is required.'),
  beforeSupport: z.string().optional(),
  thirtyDays: z.string().optional(),
  sixtyDays: z.string().optional(),
  ninetyDays: z.string().optional(),
  realImpact: z.string().optional(),
});

type ImpactTrackerFormData = z.infer<typeof impactTrackerSchema>;

export function OFAEquipmentImpactForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-teams'), orderBy('teamName'));
  }, [firestore]);
  const { data: teams, isLoading: isLoadingTeams } = useCollection<OFATeam>(teamsQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ImpactTrackerFormData>({
    resolver: zodResolver(impactTrackerSchema),
    defaultValues: {
      dateGiven: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: ImpactTrackerFormData) => {
    if (!firestore) return;
    const formData = { ...data, createdAt: serverTimestamp() };
    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-equipment-impact'), formData);
      toast({
        title: 'Impact Tracker Submitted!',
        description: `The tracker for ${data.item} has been created.`,
      });
      reset();
      router.push('/meal/ofa');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal/ofa">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to OFA Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            OFA Equipment & Support Impact Tracker
          </CardTitle>
          <CardDescription>
            Track the impact of support given to teams over 30/60/90 days.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="teamId">Team</Label>
                    {isLoadingTeams ? <Skeleton className="h-10" /> : (
                        <Controller
                        name="teamId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="teamId"><SelectValue placeholder="Select a team..." /></SelectTrigger>
                            <SelectContent>
                                {teams?.map(t => <SelectItem key={t.id} value={t.id}>{t.teamName}</SelectItem>)}
                            </SelectContent>
                            </Select>
                        )}
                        />
                    )}
                    {errors.teamId && <p className="text-sm text-destructive">{errors.teamId.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="item">Item / Support Given</Label>
                    <Input id="item" {...register('item')} />
                    {errors.item && <p className="text-sm text-destructive">{errors.item.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="dateGiven">Date Given</Label>
                <Input id="dateGiven" type="date" {...register('dateGiven')} />
                {errors.dateGiven && <p className="text-sm text-destructive">{errors.dateGiven.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="beforeSupport">Before Support (Attendance/Discipline)</Label>
                <Input id="beforeSupport" {...register('beforeSupport')} placeholder="e.g., 60% / 3.5"/>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="thirtyDays">30 Days</Label>
                    <Input id="thirtyDays" {...register('thirtyDays')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="sixtyDays">60 Days</Label>
                    <Input id="sixtyDays" {...register('sixtyDays')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="ninetyDays">90 Days</Label>
                    <Input id="ninetyDays" {...register('ninetyDays')} />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="realImpact">Real Impact (Qualitative)</Label>
              <Textarea id="realImpact" {...register('realImpact')} placeholder="e.g., Increased morale, better performance in matches..." />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Impact Tracker
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
