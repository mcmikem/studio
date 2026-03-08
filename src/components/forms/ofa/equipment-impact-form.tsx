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
      <Button variant="outline" asChild><Link href="/meal/ofa"><ArrowLeft className="mr-2 h-4 w-4" />Back to OFA Hub</Link></Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6" /> Equipment Impact Tracker</CardTitle>
          <CardDescription>Track support items given to teams and follow-up outcomes.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team</Label>
                {teamsLoading ? <Skeleton className="h-10 w-full" /> : (
                  <Controller name="teamId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger><SelectContent>{teams?.map((team) => <SelectItem key={team.id} value={team.id}>{team.teamName}</SelectItem>)}</SelectContent></Select>
                  )} />
                )}
                {errors.teamId && <p className="text-sm text-destructive">{errors.teamId.message}</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="dateGiven">Date Given</Label><Input id="dateGiven" type="date" {...register('dateGiven')} /></div>
              <div className="space-y-2"><Label htmlFor="item">Item</Label><Input id="item" {...register('item')} placeholder="e.g., Jerseys, Balls" />{errors.item && <p className="text-sm text-destructive">{errors.item.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="quantity">Quantity</Label><Input id="quantity" type="number" {...register('quantity')} />{errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}</div>
            </div>
            <div className="space-y-2"><Label htmlFor="beforeSupport">Before Support (baseline)</Label><Textarea id="beforeSupport" {...register('beforeSupport')} /></div>
            <div className="space-y-2"><Label htmlFor="thirtyDays">30-Day Follow-up</Label><Textarea id="thirtyDays" {...register('thirtyDays')} /></div>
            <div className="space-y-2"><Label htmlFor="sixtyDays">60-Day Follow-up</Label><Textarea id="sixtyDays" {...register('sixtyDays')} /></div>
            <div className="space-y-2"><Label htmlFor="ninetyDays">90-Day Follow-up</Label><Textarea id="ninetyDays" {...register('ninetyDays')} /></div>
            <div className="space-y-2"><Label htmlFor="realImpact">Observed Real Impact</Label><Textarea id="realImpact" {...register('realImpact')} /></div>
          </CardContent>
          <CardFooter><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Impact Log</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}
