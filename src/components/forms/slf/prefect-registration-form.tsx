
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
import { useFirestore, addDocumentNonBlocking, useCollection } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SLF_School } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

const prefectSchema = z.object({
  schoolId: z.string().min(1, 'Please select a school.'),
  name: z.string().min(3, 'Prefect name is required.'),
  position: z.string().min(3, 'Position is required.'),
  class: z.string().optional(),
  age: z.coerce.number().min(10, 'Age must be 10 or greater.'),
  gender: z.enum(['Male', 'Female', 'Other']),
  phone: z.string().optional(),
});

type PrefectFormData = z.infer<typeof prefectSchema>;

export function PrefectRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const schoolsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'slf-schools'), orderBy('schoolName'));
  }, [firestore]);
  const { data: schools, isLoading: isLoadingSchools } = useCollection<SLF_School>(schoolsQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PrefectFormData>({
    resolver: zodResolver(prefectSchema),
  });

  const onSubmit = async (data: PrefectFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const schoolName = schools?.find(s => s.id === data.schoolId)?.schoolName || 'Unknown School';

    const formData = { ...data, schoolName, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'slf-prefects'), formData);
      toast({
        title: 'Prefect Registered!',
        description: `${data.name} from ${schoolName} has been successfully registered.`,
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
            <UserPlus className="h-6 w-6" />
            SLF Prefect Registration
          </CardTitle>
          <CardDescription>
            Register a new prefect from a participating school.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="schoolId">School</Label>
               {isLoadingSchools ? <Skeleton className="h-10" /> : (
                <Controller
                    name="schoolId"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="schoolId"><SelectValue placeholder="Select a school..." /></SelectTrigger>
                        <SelectContent>
                            {schools?.map(s => <SelectItem key={s.id} value={s.id}>{s.schoolName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                />
               )}
              {errors.schoolId && <p className="text-sm text-destructive">{errors.schoolId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Prefect's Full Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="position">Position/Post</Label>
              <Input id="position" {...register('position')} placeholder="e.g., Head Prefect, Health Minister"/>
              {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="class">Class/Form</Label>
                    <Input id="class" {...register('class')} placeholder="e.g., S.4" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" {...register('age')} />
                    {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
                </div>
            </div>
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
               {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" {...register('phone')} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Prefect
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
