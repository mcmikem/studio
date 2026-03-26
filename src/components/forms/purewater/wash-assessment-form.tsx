
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const washAssessmentSchema = z.object({
  school: z.string().min(3, 'School name is required.'),
  handwashingStations: z.coerce.number().min(0, 'Count must be zero or more.'),
  soapAvailable: z.boolean().default(false),
  latrineCondition: z.enum(['Good', 'Fair', 'Poor']),
  assessorComments: z.string().optional(),
});

type WashAssessmentFormData = z.infer<typeof washAssessmentSchema>;

export function WashAssessmentForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WashAssessmentFormData>({
    resolver: zodResolver(washAssessmentSchema),
    defaultValues: {
      latrineCondition: 'Fair',
      soapAvailable: false,
    },
  });

  const onSubmit = async (data: WashAssessmentFormData) => {
    if (!firestore) return;
    const formData = { ...data, createdAt: serverTimestamp() };
    try {
      await addDocumentNonBlocking(collection(firestore, 'wash-assessments'), formData);
      toast({
        title: 'WASH Assessment Logged!',
        description: `The assessment for ${data.school} has been recorded.`,
      });
      reset();
      router.push('/meal/purewater');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild className="rounded-xl">
        <Link href="/meal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to MEAL Hub
        </Link>
      </Button>
      <Card className="border shadow-comic-sm w-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white border shadow-comic-sm rounded-xl sm:rounded-2xl flex-shrink-0">
              <CheckSquare className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy truncate">
                WASH <span className="text-omuto-red">Assessment</span>
              </CardTitle>
              <CardDescription className="font-bold text-omuto-navy/50 text-[9px] sm:text-[10px] uppercase tracking-wider mt-1 sm:mt-2">
                Hygiene Verification Terminal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="school">School Name</Label>
              <Input id="school" {...register('school')} className="h-10 sm:h-11" />
              {errors.school && <p className="text-xs sm:text-sm text-destructive">{errors.school.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="handwashingStations">Number of Handwashing Stations</Label>
                    <Input id="handwashingStations" type="number" {...register('handwashingStations')} className="h-10 sm:h-11" />
                    {errors.handwashingStations && <p className="text-xs sm:text-sm text-destructive">{errors.handwashingStations.message}</p>}
                </div>
                 <div className="flex items-center space-x-2 pt-8">
                    <Controller name="soapAvailable" control={control} render={({ field }) => (
                        <Checkbox id="soapAvailable" checked={field.value} onCheckedChange={field.onChange} />
                    )} />
                    <Label htmlFor="soapAvailable">Is soap available at stations?</Label>
                </div>
            </div>
             <div className="space-y-2">
              <Label>Overall Latrine Condition</Label>
              <Controller
                name="latrineCondition"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Good" id="good" /><Label htmlFor="good">Good</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Fair" id="fair" /><Label htmlFor="fair">Fair</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Poor" id="poor" /><Label htmlFor="poor">Poor</Label></div>
                  </RadioGroup>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessorComments">Assessor's Comments (Optional)</Label>
              <Textarea id="assessorComments" {...register('assessorComments')} placeholder="e.g., Latrines are clean but lack doors..." className="min-h-[80px] sm:min-h-[100px]" />
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save WASH Assessment
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
