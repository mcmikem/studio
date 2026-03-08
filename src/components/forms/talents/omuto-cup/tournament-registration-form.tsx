'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import type { OFATeam } from '@/lib/types';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ArrowLeft, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  teamId: z.string().min(1, 'Please select a team.'),
  contactPerson: z.string().min(2, 'Contact person required.'),
  contactPhone: z.string().min(8, 'Contact phone required.'),
  ageCategory: z.enum(['U13', 'U15', 'U17', 'U19', 'Mixed']).default('U17'),
  district: z.string().optional(),
  kitColors: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function TournamentRegistrationForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-teams'), orderBy('teamName'));
  }, [firestore]);
  const { data: teams } = useCollection<OFATeam>(teamsQuery);

  const districtOptions = useMemo(() => Array.from(new Set((teams || []).map((t) => t.subcounty).filter(Boolean))).sort(), [teams]);

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ageCategory: 'U17' },
  });

  const selectedTeamId = watch('teamId');

  const onSubmit = async (data: FormData) => {
    if (!firestore) return;
    const selectedTeam = teams?.find((team) => team.id === data.teamId);
    try {
      await addDocumentNonBlocking(collection(firestore, 'omuto-cup-tournaments'), {
        ...data,
        teamName: selectedTeam?.teamName || '',
        eventName: 'Omuto Cup',
        status: 'Registered',
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Tournament Registration Saved', description: `${selectedTeam?.teamName || 'Team'} registered successfully.` });
      reset({ ageCategory: 'U17' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild><Link href="/meal/omuto-cup"><ArrowLeft className="mr-2 h-4 w-4" />Back to Omuto Cup Hub</Link></Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-6 w-6" />Tournament Registration</CardTitle>
          <CardDescription>Register participating teams and key focal contacts for Omuto Cup.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Team</Label>
              <Controller name="teamId" control={control} render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const team = teams?.find((t) => t.id === value);
                    if (team?.subcounty) setValue('district', team.subcounty);
                    if (team?.teamColours) setValue('kitColors', team.teamColours);
                  }}
                  value={field.value}
                >
                  <SelectTrigger><SelectValue placeholder="Select OFA team" /></SelectTrigger>
                  <SelectContent>{teams?.map((team) => <SelectItem key={team.id} value={team.id}>{team.teamName}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.teamId && <p className="text-sm text-destructive">{errors.teamId.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="contactPerson">Contact Person</Label><Input id="contactPerson" {...register('contactPerson')} />{errors.contactPerson && <p className="text-sm text-destructive">{errors.contactPerson.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="contactPhone">Contact Phone</Label><Input id="contactPhone" {...register('contactPhone')} />{errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone.message}</p>}</div>
              <div className="space-y-2"><Label>Age Category</Label><Controller name="ageCategory" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['U13', 'U15', 'U17', 'U19', 'Mixed'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              )} /></div>
              <div className="space-y-2"><Label htmlFor="district">District / Subcounty</Label><Input id="district" list="district-options" {...register('district')} /><datalist id="district-options">{districtOptions.map(v => <option key={v} value={v} />)}</datalist></div>
              <div className="space-y-2"><Label htmlFor="kitColors">Kit Colors</Label><Input id="kitColors" {...register('kitColors')} /></div>
              <div className="space-y-2"><Label htmlFor="emergencyContact">Emergency Contact</Label><Input id="emergencyContact" {...register('emergencyContact')} /></div>
            </div>

            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" {...register('notes')} placeholder={selectedTeamId ? 'Special requests, transport notes, roster issues...' : 'Select a team first'} /></div>
          </CardContent>
          <CardFooter><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Register Team for Tournament</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}
