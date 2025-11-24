'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, where, getDocs } from 'firebase/firestore';
import { Loader2, ArrowLeft, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SLF_School, SLF_Prefect } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

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
    const attendees = prefectsData.map(p => ({ prefectId: p.id, prefectName: p.name, attended: false }));
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
    
    const schoolName = schools?.find(s => s.id === data.schoolId)?.schoolName || 'Unknown School';

    const formData = { ...data, schoolName, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'slf-trainings'), formData);
      toast({
        title: 'Attendance Logged!',
        description: `Attendance for ${data.session} has been recorded.`,
      });
      reset();
      router.push('/meal/slf');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal/slf">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to SLF Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6" />
            SLF Training Attendance
          </CardTitle>
          <CardDescription>
            Log attendance for a specific SLF training session.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolId">School</Label>
                <Controller
                    name="schoolId"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={(value) => { field.onChange(value); setSelectedSchoolId(value); }} value={field.value}>
                        <SelectTrigger id="schoolId"><SelectValue placeholder="Select a school..." /></SelectTrigger>
                        <SelectContent>
                            {schools?.map(s => <SelectItem key={s.id} value={s.id}>{s.schoolName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                />
                {errors.schoolId && <p className="text-sm text-destructive">{errors.schoolId.message}</p>}
              </div>
               <div className="space-y-2">
                <Label htmlFor="date">Date of Training</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="session">Session Title/Topic</Label>
              <Input id="session" {...register('session')} />
              {errors.session && <p className="text-sm text-destructive">{errors.session.message}</p>}
            </div>

            {selectedSchoolId && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Mark Attendance</h3>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.prefectId} className="flex items-center gap-4 p-2 border rounded-md">
                      <Controller
                        name={`attendees.${index}.attended`}
                        control={control}
                        render={({ field: checkboxField }) => (
                          <Checkbox
                            id={`attendees.${index}.attended`}
                            checked={checkboxField.value}
                            onCheckedChange={checkboxField.onChange}
                          />
                        )}
                      />
                      <Label htmlFor={`attendees.${index}.attended`} className="flex-1 cursor-pointer">{field.prefectName}</Label>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">No prefects found for this school.</p>}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !selectedSchoolId || fields.length === 0} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Attendance
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
