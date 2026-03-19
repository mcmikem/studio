
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { YoSkillsYouth } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const ideaSchema = z.object({
  youthId: z.string().min(1, 'Please select a youth participant.'),
  businessName: z.string().min(3, 'Business name is required.'),
  problemSolved: z.string().min(10, 'Please describe the problem solved.'),
  targetCustomer: z.string().min(5, 'Please describe the target customer.'),
  startupCapitalNeeded: z.coerce.number().min(0),
});

type IdeaFormData = z.infer<typeof ideaSchema>;

export function IdeaSubmissionForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const youthQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'yoskills-youth'), orderBy('name'));
  }, [firestore]);
  const { data: youth, isLoading: isLoadingYouth } = useCollection<YoSkillsYouth>(youthQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      startupCapitalNeeded: 0,
    }
  });

  const onSubmit = async (data: IdeaFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const formData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'business-ideas'), formData);
      toast({
        title: 'Idea Submitted!',
        description: `The business idea "${data.businessName}" has been successfully submitted.`,
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
            <Lightbulb className="h-6 w-6" />
            Business Idea Submission
          </CardTitle>
          <CardDescription>
            Submit a new business idea from a YoSkills participant.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="youthId">Participant</Label>
              {isLoadingYouth ? <Skeleton className="h-10 sm:h-11" /> : (
                <Controller
                  name="youthId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="youthId" className="h-10 sm:h-11"><SelectValue placeholder="Select a participant..." /></SelectTrigger>
                      <SelectContent>
                        {youth?.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.youthId && <p className="text-xs sm:text-sm text-destructive">{errors.youthId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name / Idea Title</Label>
              <Input id="businessName" {...register('businessName')} className="h-10 sm:h-11" />
              {errors.businessName && <p className="text-xs sm:text-sm text-destructive">{errors.businessName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="problemSolved">Problem Solved</Label>
              <Textarea id="problemSolved" {...register('problemSolved')} placeholder="What problem does this business solve for the community?" className="min-h-[80px] sm:min-h-[100px]"/>
              {errors.problemSolved && <p className="text-xs sm:text-sm text-destructive">{errors.problemSolved.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetCustomer">Target Customer</Label>
              <Input id="targetCustomer" {...register('targetCustomer')} placeholder="Who is the primary customer?" className="h-10 sm:h-11" />
              {errors.targetCustomer && <p className="text-xs sm:text-sm text-destructive">{errors.targetCustomer.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="startupCapitalNeeded">Startup Capital Needed (UGX)</Label>
                <Input id="startupCapitalNeeded" type="number" {...register('startupCapitalNeeded')} className="h-10 sm:h-11" />
                {errors.startupCapitalNeeded && <p className="text-xs sm:text-sm text-destructive">{errors.startupCapitalNeeded.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Business Idea
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
