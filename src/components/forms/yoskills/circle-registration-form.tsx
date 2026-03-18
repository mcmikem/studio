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
import { Loader2, ArrowLeft, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LocationPicker } from '@/components/ui/location-picker';

const circleSchema = z.object({
  circleName: z.string().min(3, 'Circle name is required.'),
  coach: z.string().min(3, 'Coach name is required.'),
  district: z.string().optional(),
  subcounty: z.string().optional(),
  parish: z.string().optional(),
  membersCount: z.coerce.number().min(1, 'Number of members is required.'),
});

type CircleFormData = z.infer<typeof circleSchema>;

export function CircleRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CircleFormData>({
    resolver: zodResolver(circleSchema),
  });

  const onSubmit = async (data: CircleFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const formData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'yoskills-circles'), formData);
      toast({
        title: 'Circle Registered!',
        description: `The ${data.circleName} has been successfully created.`,
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
            <Zap className="h-6 w-6" />
            YoSkills Circle Registration
          </CardTitle>
          <CardDescription>
            Create a new entrepreneurship circle under the YoSkills program.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="circleName">Circle Name</Label>
              <Input id="circleName" {...register('circleName')} placeholder="e.g., Ggaba Fish Mongers" />
              {errors.circleName && <p className="text-sm text-destructive">{errors.circleName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach">Coach Name</Label>
              <Input id="coach" {...register('coach')} placeholder="e.g., Dianah Nansikombi"/>
              {errors.coach && <p className="text-sm text-destructive">{errors.coach.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <LocationPicker
                  districtValue={watch('district')}
                  subcountyValue={watch('subcounty')}
                  parishValue={watch('parish')}
                  onDistrictChange={(val) => setValue('district', val)}
                  onSubcountyChange={(val) => setValue('subcounty', val)}
                  onParishChange={(val) => setValue('parish', val)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membersCount">Number of Members</Label>
                <Input id="membersCount" type="number" {...register('membersCount')} />
                {errors.membersCount && <p className="text-sm text-destructive">{errors.membersCount.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Circle
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
