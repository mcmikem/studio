
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const schoolSchema = z.object({
  schoolName: z.string().min(3, 'School name is required.'),
  headTeacherName: z.string().min(3, 'Head Teacher name is required.'),
  contactTeacher: z.string().min(3, 'Contact teacher name is required.'),
  phone: z.string().min(10, 'A valid phone number is required.'),
  enrollmentSize: z.coerce.number().min(1, 'Enrollment size is required.'),
  location: z.string().min(3, 'Location/District is required.'),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

export function SchoolRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
  });

  const onSubmit = async (data: SchoolFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const formData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'slf-schools'), formData);
      toast({
        title: 'School Registered!',
        description: `${data.schoolName} has been successfully registered for the SLF.`,
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
            <Users className="h-6 w-6" />
            SLF School Registration
          </CardTitle>
          <CardDescription>
            Register a new school to participate in the Student Leaders Forum.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input id="schoolName" {...register('schoolName')} />
              {errors.schoolName && <p className="text-sm text-destructive">{errors.schoolName.message}</p>}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headTeacherName">Head Teacher's Name</Label>
                  <Input id="headTeacherName" {...register('headTeacherName')} />
                  {errors.headTeacherName && <p className="text-sm text-destructive">{errors.headTeacherName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactTeacher">Patron/Contact Teacher's Name</Label>
                  <Input id="contactTeacher" {...register('contactTeacher')} />
                  {errors.contactTeacher && <p className="text-sm text-destructive">{errors.contactTeacher.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone">Contact Teacher's Phone</Label>
                <Input id="phone" type="tel" {...register('phone')} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="enrollmentSize">Total School Enrollment</Label>
                    <Input id="enrollmentSize" type="number" {...register('enrollmentSize')} />
                    {errors.enrollmentSize && <p className="text-sm text-destructive">{errors.enrollmentSize.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="location">Location (District)</Label>
                    <Input id="location" {...register('location')} />
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register School
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

      