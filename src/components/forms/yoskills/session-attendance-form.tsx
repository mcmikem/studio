
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, where, getDocs } from 'firebase/firestore';
import { Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { YoSkillsCircle, YoSkillsYouth } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useMemoFirebase } from '@/firebase/provider';

const memberSchema = z.object({
  memberId: z.string(),
  memberName: z.string(),
  present: z.boolean(),
});

const sessionSchema = z.object({
  circleId: z.string().min(1, 'Please select a circle.'),
  date: z.string().min(1, 'Date is required.'),
  topic: z.string().min(3, 'Session topic is required.'),
  members: z.array(memberSchema),
});

type SessionFormData = z.infer<typeof sessionSchema>;

export function SessionAttendanceForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  const circlesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'yoskills-circles'), orderBy('circleName'));
  }, [firestore]);
  const { data: circles, isLoading: isLoadingCircles } = useCollection<YoSkillsCircle>(circlesQuery);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
     defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      members: [],
    }
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "members"
  });
  
  const fetchMembers = useCallback(async (circleId: string) => {
    if (!firestore) return;
    const membersQuery = query(collection(firestore, 'yoskills-youth'), where('circleId', '==', circleId), orderBy('name'));
    const snapshot = await getDocs(membersQuery);
    const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YoSkillsYouth));
    
    const attendees = membersData.map(m => ({ memberId: m.id, memberName: m.name || 'Unnamed Member', present: false }));
    replace(attendees);
  }, [firestore, replace]);

  useEffect(() => {
    if (selectedCircleId) {
      fetchMembers(selectedCircleId);
    } else {
      replace([]);
    }
  }, [selectedCircleId, fetchMembers, replace]);

  const onSubmit = async (data: SessionFormData) => {
     if (!firestore) return;
    
    const presentMembers = data.members.filter(m => m.present).map(m => m.memberId);
    
    const formData = {
        circleId: data.circleId,
        date: data.date,
        topic: data.topic,
        membersPresent: presentMembers,
        createdAt: serverTimestamp() 
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'yoskills-sessions'), formData);
      toast({
        title: 'Session Logged!',
        description: `Attendance for ${data.topic} has been recorded.`,
      });
      reset();
      router.push('/meal/yoskills');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal/yoskills">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to YoSkills Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            YoSkills Session Attendance
          </CardTitle>
          <CardDescription>
            Log attendance for a specific circle session.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="circleId">Select Circle</Label>
                <Controller
                    name="circleId"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={(value) => { field.onChange(value); setSelectedCircleId(value); }} value={field.value}>
                        <SelectTrigger id="circleId"><SelectValue placeholder="Select a circle..." /></SelectTrigger>
                        <SelectContent>
                            {circles?.map(c => <SelectItem key={c.id} value={c.id}>{c.circleName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                />
                {errors.circleId && <p className="text-sm text-destructive">{errors.circleId.message}</p>}
              </div>
               <div className="space-y-2">
                <Label htmlFor="date">Date of Session</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="topic">Session Topic</Label>
              <Input id="topic" {...register('topic')} />
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
            </div>

            {selectedCircleId && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Mark Attendance</h3>
                <div className="space-y-2">
                  {fields.length > 0 && fields.map((field, index) => (
                    <div key={field.memberId} className="flex items-center gap-4 p-2 border rounded-md">
                      <Controller
                        name={`members.${index}.present`}
                        control={control}
                        render={({ field: checkboxField }) => (
                          <Checkbox
                            id={`members.${index}.present`}
                            checked={checkboxField.value}
                            onCheckedChange={checkboxField.onChange}
                          />
                        )}
                      />
                      <Label htmlFor={`members.${index}.present`} className="flex-1 cursor-pointer">{field.memberName}</Label>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">No members found for this circle.</p>}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !selectedCircleId || fields.length === 0} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Session Attendance
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
