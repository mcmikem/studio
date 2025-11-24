'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BusinessIdea } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useEffect } from 'react';

const pitchScoreSchema = z.object({
  businessIdeaId: z.string().min(1, 'Please select a business idea.'),
  judgeName: z.string().min(3, "Judge's name is required."),
  innovation: z.number().min(1).max(10),
  feasibility: z.number().min(1).max(10),
  scalability: z.number().min(1).max(10),
  totalScore: z.number(),
});

type PitchScoreFormData = z.infer<typeof pitchScoreSchema>;

export function PitchScoreForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const ideasQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'business-ideas'), orderBy('businessName'));
  }, [firestore]);
  const { data: ideas, isLoading: isLoadingIdeas } = useCollection<BusinessIdea>(ideasQuery);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PitchScoreFormData>({
    resolver: zodResolver(pitchScoreSchema),
    defaultValues: {
        innovation: 5,
        feasibility: 5,
        scalability: 5,
    }
  });

  const innovation = watch('innovation');
  const feasibility = watch('feasibility');
  const scalability = watch('scalability');

  const totalScore = useMemo(() => {
    return (innovation || 0) + (feasibility || 0) + (scalability || 0);
  }, [innovation, feasibility, scalability]);

  useEffect(() => {
    setValue('totalScore', totalScore);
  }, [totalScore, setValue]);


  const onSubmit = async (data: PitchScoreFormData) => {
    if (!firestore) return;
    const formData = { ...data, createdAt: serverTimestamp() };
    try {
      await addDocumentNonBlocking(collection(firestore, 'pitch-scores'), formData);
      toast({
        title: 'Pitch Score Saved!',
        description: `The scores for the selected business idea have been recorded.`,
      });
      reset();
      router.push('/meal/yoskills');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };
  
  const ScoreSlider = ({ name, label }: { name: "innovation" | "feasibility" | "scalability", label: string }) => {
    const value = watch(name);
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <div className="flex items-center gap-4">
                        <Slider
                        min={1} max={10} step={1}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        />
                        <span className="font-bold w-12 text-center">{field.value}</span>
                    </div>
                )}
            />
        </div>
    );
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
            <Trophy className="h-6 w-6" />
            YoSkills Pitch Score Sheet
          </CardTitle>
          <CardDescription>
            Score a business idea pitch from a participant.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessIdeaId">Business Idea</Label>
              {isLoadingIdeas ? <Skeleton className="h-10" /> : (
                <Controller
                  name="businessIdeaId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="businessIdeaId"><SelectValue placeholder="Select an idea..." /></SelectTrigger>
                      <SelectContent>
                        {ideas?.map(i => <SelectItem key={i.id} value={i.id}>{i.businessName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.businessIdeaId && <p className="text-sm text-destructive">{errors.businessIdeaId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="judgeName">Judge's Name</Label>
              <Input id="judgeName" {...register('judgeName')} />
              {errors.judgeName && <p className="text-sm text-destructive">{errors.judgeName.message}</p>}
            </div>
            
            <div className="space-y-4 pt-4 border-t">
                <ScoreSlider name="innovation" label="Innovation & Originality" />
                <ScoreSlider name="feasibility" label="Feasibility & Viability" />
                <ScoreSlider name="scalability" label="Scalability & Impact" />
            </div>

            <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
                <span className="font-semibold text-lg">Total Score</span>
                <span className="font-bold text-xl">{totalScore} / 30</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Pitch Score
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
