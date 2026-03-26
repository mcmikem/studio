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
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { OFATeam } from '@/lib/types';

const impactTrackerSchema = z.object({
  teamId: z.string().min(1, 'Please select a team.'),
  item: z.string().min(2, 'Item name is required.'),
  quantity: z.coerce.number().min(1, 'Quantity is required.'),
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
  const { data: teams, isLoading: teamsLoading } = useCollection<OFATeam>(teamsQuery);

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<ImpactTrackerFormData>({
    resolver: zodResolver(impactTrackerSchema),
    defaultValues: { dateGiven: format(new Date(), 'yyyy-MM-dd') },
  });

  const onSubmit = async (data: ImpactTrackerFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const teamName = teams?.find((t) => t.id === data.teamId)?.teamName || '';

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-equipment-impact'), {
        ...data,
        teamName,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Impact Tracker Saved', description: `Impact record for ${teamName || 'team'} saved.` });
      reset({ dateGiven: format(new Date(), 'yyyy-MM-dd') });
      router.push('/meal/ofa');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild className="rounded-xl"><Link href="/meal/ofa"><ArrowLeft className="mr-2 h-4 w-4" />Back to OFA Hub</Link></Button>
      <Card className="border shadow-comic-sm w-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-card border shadow-comic-sm rounded-xl sm:rounded-2xl flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy truncate">
                Equipment <span className="text-omuto-red">Impact</span>
              </CardTitle>
              <CardDescription className="font-bold text-omuto-navy/50 text-[9px] sm:text-[10px] uppercase tracking-wider mt-1 sm:mt-2">
                Asset Tracking Terminal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team</Label>
                {teamsLoading ? <Skeleton className="h-10 sm:h-11 w-full" /> : (
                  <Controller name="teamId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-10 sm:h-11"><SelectValue placeholder="Select team" /></SelectTrigger><SelectContent>{teams?.map((team) => <SelectItem key={team.id} value={team.id}>{team.teamName}</SelectItem>)}</SelectContent></Select>
                  )} />
                )}
                {errors.teamId && <p className="text-xs sm:text-sm text-destructive">{errors.teamId.message}</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="dateGiven">Date Given</Label><Input id="dateGiven" type="date" {...register('dateGiven')} className="h-10 sm:h-11" /></div>
              <div className="space-y-2"><Label htmlFor="item">Item</Label><Input id="item" {...register('item')} placeholder="e.g., Jerseys, Balls" className="h-10 sm:h-11" /></div>
              <div className="space-y-2"><Label htmlFor="quantity">Quantity</Label><Input id="quantity" type="number" {...register('quantity')} className="h-10 sm:h-11" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="beforeSupport">Before Support (baseline)</Label><Textarea id="beforeSupport" {...register('beforeSupport')} className="min-h-[80px] sm:min-h-[100px]" /></div>
            <div className="space-y-2"><Label htmlFor="thirtyDays">30-Day Follow-up</Label><Textarea id="thirtyDays" {...register('thirtyDays')} className="min-h-[80px] sm:min-h-[100px]" /></div>
            <div className="space-y-2"><Label htmlFor="sixtyDays">60-Day Follow-up</Label><Textarea id="sixtyDays" {...register('sixtyDays')} className="min-h-[80px] sm:min-h-[100px]" /></div>
            <div className="space-y-2"><Label htmlFor="ninetyDays">90-Day Follow-up</Label><Textarea id="ninetyDays" {...register('ninetyDays')} className="min-h-[80px] sm:min-h-[100px]" /></div>
            <div className="space-y-2"><Label htmlFor="realImpact">Observed Real Impact</Label><Textarea id="realImpact" {...register('realImpact')} className="min-h-[80px] sm:min-h-[100px]" /></div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6"><Button type="submit" className="w-full h-10 sm:h-11" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Impact Log</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}
