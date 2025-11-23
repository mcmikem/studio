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
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';

const attendanceSchema = z.object({
  eventName: z.string().min(3, 'Event name is required.'),
  date: z.string().min(1, 'Date is required.'),
  participantName: z.string().min(3, 'Participant name is required.'),
  gender: z.enum(['Male', 'Female', 'Other']),
  age: z.coerce.number().min(1, 'Age is required.'),
  schoolOrCommunity: z.string().min(3, 'School or Community is required.'),
  contact: z.string().optional(),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

function AttendanceForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

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

  const onSubmit = async (data: AttendanceFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const record = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'attendance-records'), record);
      toast({
        title: 'Attendance Logged!',
        description: `${data.participantName} has been marked as present.`,
      });
      // Reset only some fields to allow for quick entry for the same event
      reset({
        ...data,
        participantName: '',
        age: undefined,
        contact: '',
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Session Attendance Form
        </CardTitle>
        <CardDescription>
          Use this form to quickly log attendance for participants in any session or event.
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
          <div className="space-y-2">
            <Label htmlFor="schoolOrCommunity">School / Community</Label>
            <Input id="schoolOrCommunity" {...register('schoolOrCommunity')} placeholder="e.g., St. Mary's College Kisubi" />
            {errors.schoolOrCommunity && <p className="text-sm text-destructive">{errors.schoolOrCommunity.message}</p>}
          </div>

          <div className="my-6 border-t-2 border-dashed" />

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
            <Label htmlFor="contact">Contact (Phone/Email - Optional)</Label>
            <Input id="contact" {...register('contact')} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Attendance
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function AttendancePage() {
    return (
        <Suspense>
            <AttendanceForm />
        </Suspense>
    )
}

    