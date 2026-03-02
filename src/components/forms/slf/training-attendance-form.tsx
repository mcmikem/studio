
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking, useCollection } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, where, getDocs, doc, runTransaction, limit } from 'firebase/firestore';
import { Loader2, ArrowLeft, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SLF_School, SLF_Prefect, KeyResult } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useMemoFirebase } from '@/firebase/provider';

const attendeeSchema = z.object({
  prefectId: z.string(),
  prefectName: z.string(),
  attended: z.boolean(),
});

const trainingSchema = z.object({
  schoolId: z.string().min(1, 'Please select a school.'),
  session: z.string().min(3, 'Session title is required.'),
  date: z.string().min(1, 'Date is required.'),
  attendees: z.array(attendeeSchema),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

export function TrainingAttendanceForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'slf-schools'), orderBy('schoolName'));
  }, [firestore]);
  const { data: schools, isLoading: isLoadingSchools } = useCollection<SLF_School>(schoolsQuery);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
     defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      attendees: [],
    }
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "attendees"
  });
  
  const fetchPrefects = useCallback(async (schoolId: string) => {
    if (!firestore) return;
    const prefectsQuery = query(collection(firestore, 'slf-prefects'), where('schoolId', '==', schoolId), orderBy('name'));
    const snapshot = await getDocs(prefectsQuery);
    const prefectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SLF_Prefect));
    
    const attendees = prefectsData.map(p => ({ prefectId: p.id, prefectName: p.name || 'Unnamed Prefect', attended: false }));
    replace(attendees);
  }, [firestore, replace]);

  useEffect(() => {
    if (selectedSchoolId) {
      fetchPrefects(selectedSchoolId);
    } else {
      replace([]);
    }
  }, [selectedSchoolId, fetchPrefects, replace]);

  const onSubmit = async (data: TrainingFormData) => {
     if (!firestore) return;
    
    const selectedSchool = schools?.find(s => s.id === data.schoolId);
    const schoolName = selectedSchool?.schoolName || 'Unknown School';
    const attendeeCount = data.attendees.filter(a => a.attended).length;

    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Create Training Record
            const trainingRef = doc(collection(firestore, 'slf-trainings'));
            transaction.set(trainingRef, {
                ...data,
                schoolName,
                attendeeCount,
                createdAt: serverTimestamp(),
            });

            // 2. Automate Key Result Update
            // We search for a Key Result related to "SLF" or "Student Leader"
            const krQuery = query(
                collection(firestore, 'key-results'),
                where('title', '>=', 'SLF'),
                where('title', '<=', 'SLF' + '\uf8ff'),
                limit(1)
            );
            const krSnapshot = await getDocs(krQuery);
            
            if (!krSnapshot.empty) {
                const krDoc = krSnapshot.docs[0];
                const currentProgress = krDoc.data().currentProgress || 0;
                transaction.update(krDoc.ref, {
                    currentProgress: currentProgress + attendeeCount
                });
            }
        });

        toast({
            title: 'Attendance Logged & KR Updated!',
            description: `${attendeeCount} leaders added to the strategic tracker.`,
        });
        reset();
        router.push('/meal/slf');
    } catch (error: any) {
        console.error("Transaction failed: ", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild className="rounded-xl border-lg shadow-comic-sm">
        <Link href="/meal/slf">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Hub
        </Link>
      </Button>
      <Card className="border-lg shadow-comic-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter">
            <CheckSquare className="h-8 w-8 text-primary" />
            Training Attendance
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
            Log participation and auto-update organizational Key Results.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="schoolId" className="font-bold text-xs uppercase tracking-widest">Select School</Label>
                <Controller
                    name="schoolId"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={(value) => { field.onChange(value); setSelectedSchoolId(value); }} value={field.value}>
                        <SelectTrigger id="schoolId" className="h-12 border-lg rounded-xl font-bold font-mono text-xs tracking-widest uppercase">
                            <SelectValue placeholder="Which school?" />
                        </SelectTrigger>
                        <SelectContent className="border-lg rounded-xl">
                            {schools?.map(s => <SelectItem key={s.id} value={s.id} className="font-bold uppercase text-[10px] tracking-widest">{s.schoolName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                />
                {errors.schoolId && <p className="text-xs text-destructive font-bold">{errors.schoolId.message}</p>}
              </div>
               <div className="space-y-2">
                <Label htmlFor="date" className="font-bold text-xs uppercase tracking-widest">Training Date</Label>
                <Input id="date" type="date" {...register('date')} className="h-12 border-lg rounded-xl font-bold" />
                {errors.date && <p className="text-xs text-destructive font-bold">{errors.date.message}</p>}
              </div>
            </div>
             <div className="space-y-2 pt-4 border-t border-dashed">
              <Label htmlFor="session" className="font-bold text-xs uppercase tracking-widest">Session Title / Core Topic</Label>
              <Input id="session" {...register('session')} placeholder="e.g., Emotional Intelligence & Leadership" className="h-12 border-lg rounded-xl font-bold" />
              {errors.session && <p className="text-xs text-destructive font-bold">{errors.session.message}</p>}
            </div>

            {selectedSchoolId && (
              <div className="space-y-4 pt-6 border-t-lg border-omuto-navy/10">
                <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase text-sm tracking-tighter">Mark Leader Attendance</h3>
                    <Badge variant="outline" className="font-black text-xs border-lg">{data.attendees.filter((a: any) => a.attended).length} PRESENT</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fields.length > 0 && fields.map((field, index) => (
                    <div key={field.prefectId} className="flex items-center gap-4 p-3 border-lg rounded-2xl bg-muted/20 hover:bg-primary/5 transition-colors cursor-pointer group">
                      <Controller
                        name={`attendees.${index}.attended`}
                        control={control}
                        render={({ field: checkboxField }) => (
                          <Checkbox
                            id={`attendees.${index}.attended`}
                            checked={checkboxField.value}
                            onCheckedChange={checkboxField.onChange}
                            className="h-5 w-5 border-lg"
                          />
                        )}
                      />
                      <Label htmlFor={`attendees.${index}.attended`} className="flex-1 cursor-pointer font-bold text-xs uppercase tracking-tight group-hover:text-primary transition-colors">{field.prefectName}</Label>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-xs font-bold text-muted-foreground text-center p-8 bg-muted/10 rounded-2xl border-lg border-dashed">No prefects found for this school.</p>}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 border-t-lg border-omuto-navy/10 p-8">
            <Button type="submit" disabled={isSubmitting || !selectedSchoolId || fields.length === 0} className="btn-omuto w-full h-16 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl border-white">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckSquare className="mr-2 h-5 w-5" />}
              Save Attendance & Update Progress
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
