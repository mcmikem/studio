'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, Users, Check } from 'lucide-react';
import { OfflineStatus } from '@/components/ui/offline-status';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useAutoSave, loadDraft, clearDraft } from '@/hooks/use-auto-save';
import type { SchoolXperience } from '@/lib/types';

const leaderSchema = z.object({
  schoolId: z.string().min(1, 'School is required'),
  schoolName: z.string().min(1, 'School name is required'),
  name: z.string().min(2, 'Leader name is required'),
  role: z.string().min(2, 'Role is required'),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  year: z.string().optional(),
  contact: z.string().refine(
    (val) => !val || /^(\+?256|0)7\d{8}$/.test(val.replace(/[\s\-\.]/g, '')),
    'Enter a valid Uganda phone (e.g., 0771234567)'
  ).optional(),
});

type LeaderFormData = z.infer<typeof leaderSchema>;

const ROLES = ['Head Prefect', 'Deputy Prefect', 'Health Prefect', 'Environment Prefect', 'Academic Prefect', 'Games Prefect', 'Patron Teacher', 'Student Leader', 'Club President', 'Other'];

function LeaderFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { submit } = useFormSubmission();

  const preselectedSchoolId = searchParams.get('schoolId') || '';
  const preselectedSchoolName = searchParams.get('schoolName') || '';

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore]);

  const { data: schools } = useCollection<SchoolXperience>(schoolsQuery);

  const leaderForm = useForm<LeaderFormData>({
    resolver: zodResolver(leaderSchema),
    defaultValues: {
      schoolId: preselectedSchoolId,
      schoolName: preselectedSchoolName,
    },
  });

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = leaderForm;
  const selectedSchoolId = watch('schoolId');
  const selectedSchool = schools?.find((s) => s.id === selectedSchoolId);

  useEffect(() => {
    if (!preselectedSchoolId) {
      const savedDraft = loadDraft<LeaderFormData>('leader');
      if (savedDraft) {
        Object.entries(savedDraft).forEach(([key, value]) => {
          setValue(key as keyof LeaderFormData, value as any)
        })
      }
    }
  }, []);

  useAutoSave({ form: leaderForm, draftKey: 'leader', delay: 2000 });

  const onSubmit = async (data: LeaderFormData) => {
    const result = await submit({
      collectionName: 'sx-leaders',
      data,
      idempotencyKey: `leader_${data.schoolId}_${data.name}`.toLowerCase().replace(/\s+/g, '_'),
    });

    if (result.isOffline) {
      toast({ title: 'Saved Offline', description: 'Leader queued — will sync when you reconnect.' });
    } else if (result.isQueued) {
      toast({ title: 'Saved', description: 'Queued for sync when connected.' });
      clearDraft('leader');
    } else {
      toast({ title: 'Leader Registered', description: `${data.name} added to ${data.schoolName}` });
      clearDraft('leader');
    }
    router.push(data.schoolId ? `/school-xperience/${data.schoolId}` : '/school-xperience');
  };

  return (
    <div className="enterprise-form-shell">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href="/school-xperience"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
      </Button>
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter">
            <Users className="h-8 w-8 text-primary" />
            Add Student Leader
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest">
            Register a commissioned student leader or patron teacher at a partner school.
          </CardDescription>
          <div className="mt-2">
            <OfflineStatus />
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">School *</Label>
                <Controller
                  name="schoolId"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={(e) => {
                        const school = schools?.find((s) => s.id === e.target.value);
                        field.onChange(e.target.value);
                        setValue('schoolName', school?.schoolName || '');
                      }}
                      className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
                    >
                      <option value="">Select school...</option>
                      {schools?.map((s) => (
                        <option key={s.id} value={s.id}>{s.schoolName}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.schoolId && <p className="text-xs text-destructive font-bold">{errors.schoolId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Leader Name *</Label>
                <Input {...register('name')} placeholder="e.g., Amono Faith" className="border-lg rounded-xl h-12 font-bold" />
                {errors.name && <p className="text-xs text-destructive font-bold">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Role *</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
                    >
                      <option value="">Select role...</option>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                />
                {errors.role && <p className="text-xs text-destructive font-bold">{errors.role.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Gender</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2">
                      {(['Male', 'Female', 'Other'] as const).map((g) => (
                        <Button
                          key={g}
                          type="button"
                          variant={field.value === g ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => field.onChange(g)}
                          className={`flex-1 h-11 rounded-xl font-bold text-xs ${
                            field.value === g ? 'bg-primary text-primary-foreground border-primary' : ''
                          }`}
                        >
                          {field.value === g && <Check className="mr-1 h-3 w-3" />}
                          {g}
                        </Button>
                      ))}
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Academic Year</Label>
                <Input {...register('year')} placeholder="e.g., 2026" className="border-lg rounded-xl h-12 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Contact (Optional)</Label>
                <Input {...register('contact')} placeholder="e.g., 0770 000 000" className="border-lg rounded-xl h-12 font-bold" />
              </div>
            </div>

            {selectedSchool && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                <span className="font-bold">Adding to:</span> {selectedSchool.schoolName}
                {selectedSchool.location && ` — ${selectedSchool.location}`}
              </div>
            )}
          </CardContent>
          <CardFooter className="enterprise-form-footer">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Users className="mr-2 h-5 w-5" />}
              Add Leader
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export function LeaderForm() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LeaderFormInner />
    </Suspense>
  );
}
