
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
      <Card className="border shadow-comic-sm w-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-card border shadow-comic-sm rounded-2xl flex-shrink-0">
                    <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                    <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy truncate">
                        Youth <span className="text-omuto-red">Registration</span>
                    </CardTitle>
                    <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-wider mt-2">
                        YoSkills Entrepreneurship Circle Onboarding
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-4">
              <Label htmlFor="circleId" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Select Circle *</Label>
              {isLoadingCircles ? <Skeleton className="h-14 rounded-2xl" /> : (
                <Controller
                  name="circleId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="circleId" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy"><SelectValue placeholder="Select a circle..." /></SelectTrigger>
                      <SelectContent>
                        {circles?.map(c => <SelectItem key={c.id} value={c.id}>{c.circleName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.circleId && <p className="text-xs text-destructive font-bold uppercase pl-1">{errors.circleId.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Full Name *</Label>
                    <Input id="name" {...register('name')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                    {errors.name && <p className="text-xs text-destructive font-bold uppercase pl-1">{errors.name.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="age" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Age *</Label>
                    <Input id="age" type="number" {...register('age')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                    {errors.age && <p className="text-xs text-destructive font-bold uppercase pl-1">{errors.age.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Phone Number</Label>
                <Input id="phone" type="tel" {...register('phone')} className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="educationLevel" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Education Level</Label>
                <Input id="educationLevel" {...register('educationLevel')} placeholder="e.g., S.4 Leaver" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="businessInterest" className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Business Interest *</Label>
                <Input id="businessInterest" {...register('businessInterest')} placeholder="e.g., Poultry, Tailoring" className="h-14 border rounded-2xl font-bold text-base bg-white dark:bg-omuto-navy" />
                {errors.businessInterest && <p className="text-xs text-destructive font-bold uppercase pl-1">{errors.businessInterest.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 lg:p-8 bg-muted/30 border-t border-omuto-navy/10">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-14 bg-omuto-navy text-white border-white shadow-comic-sm rounded-2xl uppercase tracking-widest font-black text-sm">
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Register Youth
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
