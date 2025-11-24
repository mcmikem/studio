
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const volunteerRegistrationSchema = z.object({
  name: z.string().min(3, 'Volunteer name is required.'),
  role: z.string().min(3, 'Role is required (e.g., First Aid, Referee, Logistics).'),
  contact: z.string().min(10, 'A valid contact number is required.'),
});

type VolunteerRegistrationFormData = z.infer<typeof volunteerRegistrationSchema>;

export function VolunteerRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VolunteerRegistrationFormData>({
    resolver: zodResolver(volunteerRegistrationSchema),
  });

  const onSubmit = async (data: VolunteerRegistrationFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const registrationData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-volunteers'), registrationData);
      toast({
        title: 'Volunteer Registered!',
        description: `${data.name} has been registered as a volunteer.`,
      });
      reset();
      router.push('/talents/omuto-cup');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
       <Button variant="outline" asChild>
            <Link href="/talents/omuto-cup">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Omuto Cup Hub
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Omuto Cup Volunteer Registration
          </CardTitle>
          <CardDescription>
            Register a new volunteer for the Omuto Cup event.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" {...register('role')} placeholder="e.g., First Aid, Logistics, Referee" />
                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="contact">Contact Phone Number</Label>
                <Input id="contact" type="tel" {...register('contact')} />
                {errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Volunteer
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
