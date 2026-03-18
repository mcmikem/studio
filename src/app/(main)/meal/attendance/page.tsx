
      
'use client';

import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Users, ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createAttendanceAction, updateAttendanceAction } from '@/actions/mutations';
import type { AttendanceRecord } from '@/lib/types';
import { useEffect } from 'react';

const attendanceSchema = z.object({
  eventName: z.string().min(3, 'Event name is required.'),
  date: z.string().min(1, 'Date is required.'),
  participantName: z.string().min(3, 'Participant name is required.'),
  gender: z.enum(['Male', 'Female', 'Other']),
  age: z.coerce.number().min(1, 'Age is required.'),
  schoolOrCommunity: z.string().optional(),
  contact: z.string().optional(),
  signature: z.boolean().refine(val => val === true, {
    message: 'Signature is required to confirm attendance.',
  }),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

function AttendanceForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const attendanceId = searchParams.get('id');

  const { data: existingRecord, isLoading: isLoadingRecord } = useDoc<AttendanceRecord>(
      firestore && attendanceId ? doc(firestore, 'attendance-records', attendanceId) : null
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      gender: 'Female',
    },
  });

  useEffect(() => {
    if (existingRecord) {
        reset({
            eventName: existingRecord.eventName,
            date: existingRecord.date,
            participantName: existingRecord.participantName,
            gender: existingRecord.gender as any,
            age: existingRecord.age,
            signature: existingRecord.signature,
        });
    }
  }, [existingRecord, reset]);

  const onSubmit = async (data: AttendanceFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Session not ready' });
      return;
    }

    const recordData = { 
        ...data, 
        userId: existingRecord?.userId || user.uid,
        userName: existingRecord?.userName || user.displayName || user.email?.split('@')[0] || 'Unknown User',
    };

    try {
      const result = attendanceId 
        ? await updateAttendanceAction(attendanceId, recordData)
        : await createAttendanceAction(recordData);

      if (result.success) {
          toast({
            title: attendanceId ? 'Record Updated!' : 'Attendance Logged!',
            description: `${data.participantName} has been ${attendanceId ? 'updated' : 'marked as present'}.`,
          });
          
          if (!attendanceId) {
              // Reset only some fields to allow for quick entry for the same event
              reset({
                ...data,
                participantName: '',
                age: undefined as any,
                signature: false,
              });
          } else {
              router.push('/meal/data/attendance');
          }
      } else {
          throw new Error((result as any).error);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to MEAL Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            {attendanceId ? 'Edit Attendance Record' : 'Session Attendance Form'}
          </CardTitle>
          <CardDescription>
            {attendanceId ? `Updating record for ${existingRecord?.participantName || 'participant'}` : 'Use this form to quickly log attendance for participants in any session or event.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name</Label>
                <Input id="eventName" {...register('eventName')} placeholder="e.g., RED Campaign Session 1" />
                {errors.eventName && <p className="text-sm text-destructive">{errors.eventName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
            </div>
            
            <div className="my-6 border-t-2 border-dashed" />
            
            <h3 className="font-semibold text-lg">Participant Details</h3>

            <div className="space-y-2">
              <Label htmlFor="participantName">Participant Name</Label>
              <Input id="participantName" {...register('participantName')} />
              {errors.participantName && <p className="text-sm text-destructive">{errors.participantName.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male">Male</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female">Female</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="Other" id="other" /><Label htmlFor="other">Other</Label></div>
                    </RadioGroup>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" {...register('age')} />
                {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolOrCommunity">School / Community (Optional)</Label>
              <Input id="schoolOrCommunity" {...register('schoolOrCommunity')} placeholder="e.g., St. Mary's College Kisubi" />
              {errors.schoolOrCommunity && <p className="text-sm text-destructive">{errors.schoolOrCommunity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact (Phone/Email - Optional)</Label>
              <Input id="contact" {...register('contact')} />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Controller
                name="signature"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="signature"
                    checked={field.value === true}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label
                htmlFor="signature"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Participant has signed the physical attendance sheet.
              </label>
            </div>
            {errors.signature && <p className="text-sm text-destructive">{errors.signature.message}</p>}

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !!(attendanceId && isLoadingRecord)} className="w-full">
              {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                  attendanceId ? <Save className="mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />
              )}
              {attendanceId ? 'Update Record' : 'Log Attendance'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function AttendancePage() {
    return (
        <Suspense>
            <AttendanceForm />
        </Suspense>
    )
}

    