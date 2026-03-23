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
import { useFirestore, useCollection } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SLF_School } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { useMemoFirebase } from '@/firebase/provider';

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

    const batch = writeBatch(firestore);

    // 1. Create Prefect Document
    const prefectRef = doc(collection(firestore, 'slf-prefects'));
    const prefectData = { ...data, schoolName, createdAt: serverTimestamp(), id: prefectRef.id };
    batch.set(prefectRef, prefectData);

    // 2. Create Beneficiary Document
    const beneficiaryRef = doc(collection(firestore, 'beneficiaries'));
    const beneficiaryData = {
        id: beneficiaryRef.id,
        name: data.name,
        dob: '',
        gender: data.gender,
        village: schoolName, // Use school as village for context
        programEnrolled: 'Student Leaders Forum',
        school: schoolName,
        phone: data.phone,
        createdAt: serverTimestamp(),
    };
    batch.set(beneficiaryRef, beneficiaryData);

    try {
      await batch.commit();
      const isOffline = !navigator.onLine;
      toast({
        title: 'Prefect Registered!',
        description: isOffline ? 'Saved locally. Will sync when back online.' : `${data.name} from ${schoolName} has been successfully registered and added to the beneficiary database.`,
      });
      reset();
      router.push('/meal/slf');
    } catch (error: any) {
      const isOffline = !navigator.onLine;
      if (isOffline && (error.code === 'unavailable' || error.message?.includes('offline'))) {
        toast({ title: 'Saved Offline', description: 'Prefect registration will sync when back online.' });
        reset();
        router.push('/meal/slf');
      } else {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
      }
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
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 lg:p-8">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl">
            <UserPlus className="h-6 w-6" />
            SLF Prefect Registration
          </CardTitle>
          <CardDescription>
            Register a new prefect from a participating school. This will also create a master beneficiary record.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="space-y-2">
              <Label htmlFor="schoolId" className="text-xs sm:text-sm truncate">School</Label>
               {isLoadingSchools ? <Skeleton className="h-10 sm:h-11" /> : (
                <Controller
                    name="schoolId"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="schoolId" className="h-10 sm:h-11 truncate"><SelectValue placeholder="Select a school..." /></SelectTrigger>
                        <SelectContent>
                            {schools?.map(s => <SelectItem key={s.id} value={s.id} className="truncate">{s.schoolName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                />
               )}
              {errors.schoolId && <p className="text-xs sm:text-sm text-destructive">{errors.schoolId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm truncate">Prefect's Full Name</Label>
              <Input id="name" {...register('name')} className="h-10 sm:h-11" />
              {errors.name && <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="position" className="text-xs sm:text-sm truncate">Position/Post</Label>
              <Input id="position" {...register('position')} placeholder="e.g., Head Prefect, Health Minister" className="h-10 sm:h-11"/>
              {errors.position && <p className="text-xs sm:text-sm text-destructive">{errors.position.message}</p>}
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                    <Label htmlFor="class" className="text-xs sm:text-sm">Class/Form</Label>
                    <Input id="class" {...register('class')} placeholder="e.g., S.4" className="h-10 sm:h-11" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="age" className="text-xs sm:text-sm">Age</Label>
                    <Input id="age" type="number" {...register('age')} className="h-10 sm:h-11" />
                    {errors.age && <p className="text-xs sm:text-sm text-destructive">{errors.age.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-2 sm:gap-4 pt-2 flex-wrap">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male" className="text-xs sm:text-sm">Male</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female" className="text-xs sm:text-sm">Female</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Other" id="other" /><Label htmlFor="other" className="text-xs sm:text-sm">Other</Label></div>
                  </RadioGroup>
                )}
              />
               {errors.gender && <p className="text-xs sm:text-sm text-destructive">{errors.gender.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" {...register('phone')} className="h-10 sm:h-11" />
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 lg:p-8">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Prefect
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
