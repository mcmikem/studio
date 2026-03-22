'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, getDocs } from 'firebase/firestore';
import { Loader2, ArrowLeft, StarHalf, Check } from 'lucide-react';
import { OfflineStatus } from '@/components/ui/offline-status';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, Suspense, useEffect } from 'react';
import { useAutoSave, loadDraft, clearDraft } from '@/hooks/use-auto-save';
import type { SchoolXperience } from '@/lib/types';

const scorecardSchema = z.object({
  schoolId: z.string().min(1, 'School is required'),
  schoolName: z.string().min(1, 'School name is required'),
  term: z.enum(['Term 1', 'Term 2', 'Term 3']).default('Term 1'),
  academicYear: z.string().min(4, 'Academic year is required'),
  month: z.string().min(2, 'Month is required'),
  attendanceScore: z.coerce.number().min(1).max(5),
  activitiesCompleted: z.coerce.number().min(1).max(5),
  studentEngagement: z.coerce.number().min(1).max(5),
  teacherSupport: z.coerce.number().min(1).max(5),
  notes: z.string().optional(),
});

type ScorecardFormData = z.infer<typeof scorecardSchema>;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'] as const;
const TERMS_MONTHS: Record<string, string[]> = {
  'Term 1': ['February', 'March', 'April'],
  'Term 2': ['May', 'June', 'July'],
  'Term 3': ['August', 'September', 'October', 'November'],
};

function ScoreSlider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-xs uppercase tracking-widest">{label}</Label>
        <span className="text-sm font-black text-primary">{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-lg font-black text-sm transition-all ${
              n <= value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-primary/20'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScorecardFormInner() {
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

  const scorecardForm = useForm<ScorecardFormData>({
    resolver: zodResolver(scorecardSchema),
    defaultValues: {
      schoolId: preselectedSchoolId,
      schoolName: preselectedSchoolName,
      term: 'Term 1',
      academicYear: new Date().getFullYear().toString(),
      month: new Date().toLocaleString('default', { month: 'long' }),
      attendanceScore: 3,
      activitiesCompleted: 3,
      studentEngagement: 3,
      teacherSupport: 3,
    },
  });

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting }, getValues } = scorecardForm;

  const selectedSchoolId = watch('schoolId');
  const selectedSchool = schools?.find((s) => s.id === selectedSchoolId);
  const selectedTerm = watch('term');
  const attendance = watch('attendanceScore');
  const activities = watch('activitiesCompleted');
  const engagement = watch('studentEngagement');
  const support = watch('teacherSupport');

  useEffect(() => {
    if (!preselectedSchoolId) {
      const savedDraft = loadDraft<ScorecardFormData>('scorecard');
      if (savedDraft) {
        Object.entries(savedDraft).forEach(([key, value]) => {
          setValue(key as keyof ScorecardFormData, value as any)
        })
      }
    }
  }, []);

  useAutoSave({ form: scorecardForm, draftKey: 'scorecard', delay: 2000 });

  const overallScore = ((attendance + activities + engagement + support) / 4).toFixed(1);
  const rating = parseFloat(overallScore) >= 4 ? 'Green' : parseFloat(overallScore) >= 2.5 ? 'Amber' : 'Red';
  const ratingColors: Record<string, string> = {
    Red: 'bg-red-100 text-red-700 border-red-200',
    Amber: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Green: 'bg-green-100 text-green-700 border-green-200',
  };

  const onSubmit = async (data: ScorecardFormData) => {
    if (firestore) {
      const dupCheck = await getDocs(query(
        collection(firestore, 'sx-scorecards'),
        where('schoolId', '==', data.schoolId),
        where('term', '==', data.term),
        where('month', '==', data.month),
        where('academicYear', '==', data.academicYear)
      ));
      if (!dupCheck.empty) {
        toast({ variant: 'destructive', title: 'Already Submitted', description: `A scorecard exists for ${data.schoolName} — ${data.term}, ${data.month} ${data.academicYear}.` });
        return;
      }
    }

    const result = await submit({
      collectionName: 'sx-scorecards',
      data: {
        ...data,
        overallScore: parseFloat(overallScore),
        rating,
      },
      idempotencyKey: `sc_${data.schoolId}_${data.term}_${data.month}_${data.academicYear}`,
    });

    if (result.isOffline) {
      toast({ title: 'Saved Offline', description: 'Scorecard queued — will sync when you reconnect.' });
    } else if (result.isQueued) {
      toast({ title: 'Saved', description: 'Queued for sync when connected.' });
      clearDraft('scorecard');
    } else {
      toast({ title: 'Scorecard Submitted', description: `${data.schoolName} — ${rating} (${overallScore}/5)` });
      clearDraft('scorecard');
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
            <StarHalf className="h-8 w-8 text-primary" />
            Submit Monthly Scorecard
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest">
            Score school performance across 4 dimensions. RAG rating auto-calculates.
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
                <Label className="font-bold text-xs uppercase tracking-widest">Term *</Label>
                <Controller
                  name="term"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value as any);
                        setValue('month', TERMS_MONTHS[e.target.value]?.[0] || '');
                      }}
                      className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
                    >
                      {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Month *</Label>
                <Controller
                  name="month"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
                    >
                      {(TERMS_MONTHS[selectedTerm] || MONTHS).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Academic Year *</Label>
                <Input {...register('academicYear')} placeholder="e.g., 2026" className="border-lg rounded-xl h-12 font-bold" />
                {errors.academicYear && <p className="text-xs text-destructive font-bold">{errors.academicYear.message}</p>}
              </div>
            </div>

            {selectedSchool && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                <span className="font-bold">Selected:</span> {selectedSchool.schoolName}
                {selectedSchool.location && ` — ${selectedSchool.location}`}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-dashed">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Performance Scores (1–5)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ScoreSlider
                  label="Student Attendance"
                  value={attendance}
                  onChange={(v) => setValue('attendanceScore', v)}
                />
                <ScoreSlider
                  label="Activities Completed"
                  value={activities}
                  onChange={(v) => setValue('activitiesCompleted', v)}
                />
                <ScoreSlider
                  label="Student Engagement"
                  value={engagement}
                  onChange={(v) => setValue('studentEngagement', v)}
                />
                <ScoreSlider
                  label="Teacher Support"
                  value={support}
                  onChange={(v) => setValue('teacherSupport', v)}
                />
              </div>
            </div>

            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Overall Score</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-black">{overallScore}</span>
                <span className="text-xl font-bold text-muted-foreground">/5</span>
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-black border ${ratingColors[rating]}`}>
                  {rating}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Green ≥4.0 · Amber ≥2.5 · Red &lt;2.5
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest">Notes</Label>
              <Textarea
                {...register('notes')}
                placeholder="Any additional observations or context..."
                className="border-lg rounded-xl min-h-[80px] font-bold"
              />
            </div>
          </CardContent>
          <CardFooter className="enterprise-form-footer">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <StarHalf className="mr-2 h-5 w-5" />}
              Submit Scorecard
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export function ScorecardForm() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ScorecardFormInner />
    </Suspense>
  );
}
