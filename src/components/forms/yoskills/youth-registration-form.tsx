
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
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { YoSkillsCircle } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const youthSchema = z.object({
  circleId: z.string().min(1, 'Please select a circle.'),
  name: z.string().min(3, 'Youth\'s name is required.'),
  age: z.coerce.number().min(15, 'Age must be 15 or older.'),
  phone: z.string().optional(),
  educationLevel: z.string().optional(),
  businessInterest: z.string().min(3, 'Business interest is required.'),
});

type YouthFormData = z.infer<typeof youthSchema>;

export function YouthRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const circlesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'yoskills-circles'), orderBy('circleName'));
  }, [firestore]);
  const { data: circles, isLoading: isLoadingCircles } = useCollection<YoSkillsCircle>(circlesQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<YouthFormData>({
    resolver: zodResolver(youthSchema),
  });

  const onSubmit = async (data: YouthFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const formData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'yoskills-youth'), formData);
      toast({
        title: 'Youth Registered!',
        description: `${data.name} has been successfully added to the circle.`,
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
            <UserPlus className="h-6 w-6" />
            YoSkills Youth Registration
          </CardTitle>
          <CardDescription>
            Add a new youth participant to an entrepreneurship circle.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="circleId">Select Circle</Label>
              {isLoadingCircles ? <Skeleton className="h-10 sm:h-11" /> : (
                <Controller
                  name="circleId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="circleId" className="h-10 sm:h-11"><SelectValue placeholder="Select a circle..." /></SelectTrigger>
                      <SelectContent>
                        {circles?.map(c => <SelectItem key={c.id} value={c.id}>{c.circleName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.circleId && <p className="text-xs sm:text-sm text-destructive">{errors.circleId.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register('name')} className="h-10 sm:h-11" />
                    {errors.name && <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" {...register('age')} className="h-10 sm:h-11" />
                    {errors.age && <p className="text-xs sm:text-sm text-destructive">{errors.age.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" {...register('phone')} className="h-10 sm:h-11" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="educationLevel">Education Level (Optional)</Label>
                <Input id="educationLevel" {...register('educationLevel')} placeholder="e.g., S.4 Leaver" className="h-10 sm:h-11" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="businessInterest">Business Interest</Label>
                <Input id="businessInterest" {...register('businessInterest')} placeholder="e.g., Poultry, Tailoring" className="h-10 sm:h-11" />
                {errors.businessInterest && <p className="text-xs sm:text-sm text-destructive">{errors.businessInterest.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Youth
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
