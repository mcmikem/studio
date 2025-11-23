'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const beneficiarySchema = z.object({
  name: z.string().min(3, 'Beneficiary name is required.'),
  age: z.coerce.number().min(1, 'Age is required.'),
  village: z.string().min(3, 'Village is required.'),
  programEnrolled: z.string().min(1, 'Please select a program.'),
  school: z.string().optional(),
  phone: z.string().optional(),
  guardianContact: z.string().optional(),
});

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

function BeneficiaryRegistrationForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const programsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'), orderBy('title'));
  }, [firestore]);
  const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
  });

  const onSubmit = async (data: BeneficiaryFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const record = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'beneficiaries'), record);
      toast({
        title: 'Beneficiary Registered!',
        description: `${data.name} has been added to the system.`,
      });
      reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          Beneficiary Registration Form
        </CardTitle>
        <CardDescription>
          Create a new profile for a beneficiary to track their journey with Omuto.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" {...register('age')} />
              {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="village">Village / Parish</Label>
            <Input id="village" {...register('village')} />
            {errors.village && <p className="text-sm text-destructive">{errors.village.message}</p>}
          </div>
           <div className="space-y-2">
              <Label htmlFor="programEnrolled">Program Enrolled In</Label>
               {isLoadingPrograms ? <Skeleton className="h-10 w-full" /> : (
                <Controller
                    name="programEnrolled"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="programEnrolled">
                            <SelectValue placeholder="Select a program..." />
                        </SelectTrigger>
                        <SelectContent>
                            {programs?.map(p => (
                                <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    )}
                />
               )}
              {errors.programEnrolled && <p className="text-sm text-destructive">{errors.programEnrolled.message}</p>}
            </div>
          
          <div className="my-6 border-t-2 border-dashed" />
            <h3 className="text-md font-semibold text-muted-foreground">Optional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="school">School (if applicable)</Label>
                    <Input id="school" {...register('school')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" {...register('phone')} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="guardianContact">Guardian's Name & Contact</Label>
                <Input id="guardianContact" {...register('guardianContact')} />
            </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Beneficiary
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function BeneficiaryRegistrationPage() {
    return (
        <Suspense>
            <BeneficiaryRegistrationForm />
        </Suspense>
    )
}

    