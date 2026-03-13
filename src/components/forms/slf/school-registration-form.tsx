
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
  headTeacherName: z.string().min(3, "Head Teacher's name is required."),
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
      <Button variant="outline" size="sm" asChild>
        <Link href="/meal/slf">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to SLF Hub
        </Link>
      </Button>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="h-5 sm:h-6 w-5 sm:w-6" />
            SLF School Registration
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Register a new school to participate in the Student Leaders Forum.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-xs sm:text-sm">School Name</Label>
              <Input id="schoolName" {...register('schoolName')} className="h-12" />
              {errors.schoolName && <p className="text-sm text-destructive">{errors.schoolName.message}</p>}
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headTeacherName" className="text-xs sm:text-sm">Head Teacher's Name</Label>
                  <Input id="headTeacherName" {...register('headTeacherName')} className="h-12" />
                  {errors.headTeacherName && <p className="text-sm text-destructive">{errors.headTeacherName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactTeacher" className="text-xs sm:text-sm">Patron/Contact Teacher's Name</Label>
                  <Input id="contactTeacher" {...register('contactTeacher')} className="h-12" />
                  {errors.contactTeacher && <p className="text-sm text-destructive">{errors.contactTeacher.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Contact Teacher's Phone</Label>
                <Input id="phone" type="tel" {...register('phone')} className="h-12" />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="enrollmentSize" className="text-xs sm:text-sm">Total School Enrollment</Label>
                    <Input id="enrollmentSize" type="number" {...register('enrollmentSize')} className="h-12" />
                    {errors.enrollmentSize && <p className="text-sm text-destructive">{errors.enrollmentSize.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs sm:text-sm">Location (district)</Label>
                    <Input id="location" {...register('location')} className="h-12" />
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isSubmitting} className="w-full h-12">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register School
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    