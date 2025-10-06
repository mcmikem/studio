'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Stepper, Step, useStepper } from '@/components/ui/stepper';
import { Loader2, Check, Send } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Badge } from '../ui/badge';

const checkinSchema = z.object({
  mainFocus: z.string().min(1, 'Please select a main focus.'),
  customTask: z.string().optional(),
  timeBlock1: z.string().optional(),
  timeBlock2: z.string().optional(),
  timeBlock3: z.string().optional(),
  timeBlock4: z.string().optional(),
  multiWinConnections: z.array(z.string()).optional(),
  otherConnection: z.string().optional(),
  transport: z.string().optional(),
  materials: z.string().optional(),
  teamSupport: z.array(z.string()).optional(),
  budget: z.coerce.number().optional(),
  challenges: z.string().optional(),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

const steps = [
  { label: 'Check In' },
  { label: 'Plan Day' },
  { label: 'Review & Submit' },
];

export function CheckinForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
      },
      () => setLocation('Location access denied.')
    );
  }, []);

  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      multiWinConnections: [],
      teamSupport: [],
    },
  });

  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'), orderBy('title'));
  }, [firestore]);
  const { data: keyResults, isLoading: isLoadingKR } = useCollection<KeyResult>(keyResultsQuery);

  const selectedFocus = form.watch('mainFocus');
  const selectedKR = useMemo(() => keyResults?.find(kr => kr.id === selectedFocus), [keyResults, selectedFocus]);

  const onSubmit = (data: CheckinFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    
    let mission = data.mainFocus === 'custom' ? data.customTask : keyResults?.find(kr => kr.id === data.mainFocus)?.description;

    const checkinData = {
      primaryMission: mission,
      details: data,
      userId: user.uid,
      name: profile.name,
      timestamp: serverTimestamp(),
    };

    const checkinsCollection = collection(firestore, 'checkins');
    addDocumentNonBlocking(checkinsCollection, checkinData);

    toast({ title: 'Daily Plan Submitted!', description: 'Your strategic plan for the day is logged.' });
    form.reset();
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <Stepper initialStep={0} steps={steps}>
        {steps.map((stepProps, index) => {
          if (index === 0) {
            return (
              <Step key={stepProps.label} {...stepProps}>
                <CardHeader>
                    <CardTitle>Basic Check-In</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
                  <p><strong>Location:</strong> {location || 'Fetching...'}</p>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                </CardContent>
              </Step>
            );
          }
          if (index === 1) {
            return (
                <Step key={stepProps.label} {...stepProps}>
                    <CardHeader>
                        <CardTitle>AI Daily Planning Assistant</CardTitle>
                        <CardDescription>Let&apos;s plan your day strategically.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Section 1: Priority Selection */}
                        <section>
                            <Label className="font-semibold text-base">Section 1: Priority Selection</Label>
                            <Controller
                                name="mainFocus"
                                control={form.control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select your main focus..." /></SelectTrigger>
                                    <SelectContent>
                                        {isLoadingKR ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                                        keyResults?.map(kr => <SelectItem key={kr.id} value={kr.id}>{kr.title}: {kr.description}</SelectItem>)}
                                        <SelectItem value="custom">Custom Task</SelectItem>
                                    </SelectContent>
                                    </Select>
                                )}
                            />
                            {selectedFocus === 'custom' && <Input {...form.register('customTask')} placeholder="Type your custom task" className="mt-2" />}
                            {selectedKR && (
                                <Card className="mt-2 bg-muted/50 p-4 text-sm">
                                    <p><strong>Selected:</strong> {selectedKR.description}</p>
                                    <p><strong>Progress:</strong> {selectedKR.currentProgress} of {selectedKR.target} completed</p>
                                    <p><strong>Priority:</strong> <Badge variant={selectedKR.priority === 'High' ? 'destructive' : 'secondary'}>{selectedKR.priority}</Badge></p>
                                </Card>
                            )}
                        </section>

                        {/* Section 2: Time-Blocked Planning */}
                        <section className="space-y-2">
                             <Label className="font-semibold text-base">Section 2: Time-Blocked Planning</Label>
                            <Input {...form.register('timeBlock1')} placeholder="8:00-10:00 AM: Activity description" />
                            <Input {...form.register('timeBlock2')} placeholder="10:00-12:00 PM: Activity description" />
                            <Input {...form.register('timeBlock3')} placeholder="1:00-3:00 PM: Activity description" />
                            <Input {...form.register('timeBlock4')} placeholder="3:00-5:00 PM: Activity description" />
                        </section>

                        {/* Section 3: Multi-Win Connection */}
                        <section className="space-y-2">
                            <Label className="font-semibold text-base">Section 3: Multi-Win Connection</Label>
                            <div className="flex items-center space-x-2"><Checkbox id="c1" onCheckedChange={(c) => c && form.setValue('multiWinConnections', [...form.getValues('multiWinConnections') || [], 'photos'])} /><Label htmlFor="c1">Capture photos/video for Omuto Pulse</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="c2" onCheckedChange={(c) => c && form.setValue('multiWinConnections', [...form.getValues('multiWinConnections') || [], 'volunteers'])} /><Label htmlFor="c2">Identify potential volunteers/partners</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="c3" onCheckedChange={(c) => c && form.setValue('multiWinConnections', [...form.getValues('multiWinConnections') || [], 'data'])} /><Label htmlFor="c3">Collect data for impact reporting</Label></div>
                             <Input {...form.register('otherConnection')} placeholder="Other connection..." />
                        </section>

                        {/* Section 4: Resource & Support Check */}
                        <section className="space-y-4">
                             <Label className="font-semibold text-base">Section 4: Resource & Support Check</Label>
                             <div className="grid grid-cols-2 gap-4">
                                <Input {...form.register('transport')} placeholder="Transport: Needed" />
                                <Input {...form.register('budget')} type="number" placeholder="Budget: 50000" />
                             </div>
                             <Textarea {...form.register('materials')} placeholder="Materials: List required items..." />
                             <Textarea {...form.register('challenges')} placeholder="Potential Challenges..." />
                        </section>
                    </CardContent>
                </Step>
            );
          }
          if (index === 2) {
             return (
                <Step key={stepProps.label} {...stepProps}>
                     <CardHeader>
                        <CardTitle>Daily Plan Summary</CardTitle>
                        <CardDescription>Review your plan before starting your day.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <p><strong>Main Focus:</strong> {form.getValues('mainFocus') === 'custom' ? form.getValues('customTask') : keyResults?.find(kr => kr.id === form.getValues('mainFocus'))?.description}</p>
                       <p><strong>Time Allocation:</strong> 8 hours</p>
                       <p><strong>Multi-Win Goals:</strong> {form.getValues('multiWinConnections')?.join(', ')}</p>
                       <p><strong>Support Needed:</strong> {form.getValues('transport')}, {form.getValues('materials')}</p>
                       <p><strong>Risk Mitigation:</strong> {form.getValues('challenges')}</p>
                       <Button className="w-full" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
                         {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Check />} Approve & Start Day
                       </Button>
                    </CardContent>
                </Step>
             )
          }
          return null;
        })}
        <CustomFooter />
      </Stepper>
    </div>
  );
}


const CustomFooter = () => {
  const {
    activeStep,
    isLastStep,
    isOptionalStep,
    isDisabledStep,
    nextStep,
    prevStep,
  } = useStepper();

  return (
    <div className="flex w-full justify-end gap-2 p-4">
      {activeStep !== 0 && (
        <Button onClick={prevStep} size="sm" variant="secondary">
          Prev
        </Button>
      )}
      {!isLastStep && (
        <Button onClick={nextStep} size="sm">
            Next
        </Button>
      )}
    </div>
  );
};
    