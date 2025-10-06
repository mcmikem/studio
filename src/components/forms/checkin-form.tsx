'use client';
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, query, orderBy, where, limit, Timestamp } from 'firebase/firestore';
import type { KeyResult, User, Checkout } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Check, PlusCircle, X, ArrowRight, Wand2, Sparkles } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '../ui/multi-select';
import { dailyPlannerAI, DailyPlannerAIOutput } from '@/ai/flows/daily-planner-flow';

const timeOptions = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
];

const checkinSchema = z.object({
  mainFocus: z.string().min(1, 'Please select a main focus.'),
  customTask: z.string().optional(),
  timeBlocks: z
    .array(
      z.object({
        startTime: z.string().min(1, 'Required'),
        endTime: z.string().min(1, 'Required'),
        description: z.string().min(3, 'Required'),
      })
    )
    .optional(),
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
  { id: '01', name: 'Check In', description: 'Confirm your status.' },
  { id: '02', name: 'Plan Day', description: "Strategize today's activities." },
  { id: '03', name: 'Review & Submit', description: 'Finalize your plan.' },
];

function Step1({ location }: { location: string | null }) {
  return (
    <>
      <CardHeader>
        <CardTitle>Basic Check-In</CardTitle>
        <CardDescription>
          Confirm your current status before planning your day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 border rounded-lg">
          <span className="text-muted-foreground">Time:</span>
          <span className="font-semibold">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 border rounded-lg">
          <span className="text-muted-foreground">Location:</span>
          <span className="font-semibold">{location || 'Fetching...'}</span>
        </div>
        <div className="flex justify-between items-center p-3 border rounded-lg">
          <span className="text-muted-foreground">Date:</span>
          <span className="font-semibold">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </>
  );
}

function Step2({
  form,
  keyResults,
  isLoadingKR,
  selectedKR,
  teamMembers,
  profile,
  missionFromYesterday,
}: {
  form: any;
  keyResults: KeyResult[] | null;
  isLoadingKR: boolean;
  selectedKR: KeyResult | undefined;
  teamMembers: User[] | null;
  profile: User | null;
  missionFromYesterday?: string | null;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'timeBlocks',
  });

  const [aiSuggestions, setAiSuggestions] = useState<DailyPlannerAIOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const toast = useToast();

  const { watch } = form;
  const mainFocus = watch('mainFocus');
  const customTask = watch('customTask');
  
  const handleBrainstorm = async () => {
      if (!mainFocus || !profile) return;
      
      const task = mainFocus === 'custom' ? customTask : selectedKR?.description;
      if (!task) {
          toast({ variant: "destructive", title: "Please select or define a task first." });
          return;
      }

      setIsAiLoading(true);
      setAiSuggestions(null);

      try {
          const suggestions = await dailyPlannerAI({ task, role: profile.role });
          setAiSuggestions(suggestions);
      } catch (error) {
          console.error("AI brainstorming error:", error);
          toast({ variant: "destructive", title: "AI Assistant Error", description: "Could not fetch suggestions." });
      } finally {
          setIsAiLoading(false);
      }
  };


  return (
    <>
      <CardHeader>
        <CardTitle>AI Daily Planning Assistant</CardTitle>
        <CardDescription>Let&apos;s plan your day strategically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4 rounded-lg border p-4">
            <div className="flex justify-between items-center">
                <Label className="font-semibold text-base">
                    Section 1: Priority Selection
                </Label>
                <Button variant="outline" size="sm" onClick={handleBrainstorm} disabled={isAiLoading || !mainFocus}>
                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Brainstorm with AI
                </Button>
            </div>
            <Controller
              name="mainFocus"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your main focus..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingKR ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      <>
                        {missionFromYesterday && <SelectItem value={missionFromYesterday}>{missionFromYesterday}</SelectItem>}
                        {keyResults?.map((kr) => (
                          <SelectItem key={kr.id} value={kr.id}>
                            {kr.title}: {kr.description}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    <SelectItem value="custom">Custom Task</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          {form.formState.errors.mainFocus && (
            <p className="text-sm text-destructive">{`${form.formState.errors.mainFocus.message}`}</p>
          )}
          {form.watch('mainFocus') === 'custom' && (
            <Input
              {...form.register('customTask')}
              placeholder="Type your custom task"
              className="mt-2"
            />
          )}
          {selectedKR && (
            <Card className="mt-2 bg-muted/50 p-4 text-sm">
              <CardHeader className="p-0 mb-2">
                <CardTitle className="text-base">
                  {selectedKR.title}: {selectedKR.description}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-1">
                <p>
                  <strong>Current Progress:</strong>{' '}
                  {selectedKR.currentProgress} of {selectedKR.target}{' '}
                  completed
                </p>
                <p>
                  <strong>Priority:</strong>{' '}
                  <Badge
                    variant={
                      selectedKR.priority === 'High'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {selectedKR.priority}
                  </Badge>
                </p>
              </CardContent>
            </Card>
          )}

          {isAiLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI is thinking...</span>
              </div>
          )}

          {aiSuggestions && (
              <Card className="bg-primary/10 border-primary/50">
                  <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          AI Suggestions
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                          {aiSuggestions.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                  </CardContent>
              </Card>
          )}

        </section>

        <section className="space-y-4  rounded-lg border p-4">
          <Label className="font-semibold text-base">
            Section 2: Time-Blocked Planning
          </Label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2">
              <div className="grid grid-cols-2 gap-2 flex-grow">
                 <div className="space-y-1">
                    <Label htmlFor={`start-time-${index}`} className="text-xs">Start</Label>
                    <Controller
                    name={`timeBlocks.${index}.startTime`}
                    control={form.control}
                    render={({ field }) => (
                        <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        >
                        <SelectTrigger id={`start-time-${index}`}>
                            <SelectValue placeholder="Start" />
                        </SelectTrigger>
                        <SelectContent>
                            {timeOptions.map((t) => (
                            <SelectItem key={t + '-start'} value={t}>
                                {t}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    )}
                    />
                 </div>
                 <div className="space-y-1">
                    <Label htmlFor={`end-time-${index}`} className="text-xs">End</Label>
                    <Controller
                    name={`timeBlocks.${index}.endTime`}
                    control={form.control}
                    render={({ field }) => (
                        <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        >
                        <SelectTrigger id={`end-time-${index}`}>
                            <SelectValue placeholder="End" />
                        </SelectTrigger>
                        <SelectContent>
                            {timeOptions.map((t) => (
                            <SelectItem key={t + '-end'} value={t}>
                                {t}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    )}
                    />
                 </div>
              </div>
              <div className="flex-grow space-y-1">
                <Label htmlFor={`desc-${index}`} className="text-xs">Description</Label>
                <Input
                    {...form.register(`timeBlocks.${index}.description`)}
                    placeholder="Activity description"
                    id={`desc-${index}`}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ startTime: '', endTime: '', description: '' })
            }
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Time Block
          </Button>
        </section>

        <section className="space-y-4  rounded-lg border p-4">
          <Label className="font-semibold text-base">
            Section 3: Multi-Win Connection
          </Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Controller
                name="multiWinConnections"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Checkbox
                      id="c1"
                      checked={field.value?.includes('photos')}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), 'photos'])
                          : field.onChange(
                              field.value?.filter((v: string) => v !== 'photos')
                            );
                      }}
                    />
                    <Label htmlFor="c1" className="cursor-pointer">
                      Capture photos/video for Omuto Pulse
                    </Label>
                  </>
                )}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="multiWinConnections"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Checkbox
                      id="c2"
                      checked={field.value?.includes('volunteers')}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([
                              ...(field.value || []),
                              'volunteers',
                            ])
                          : field.onChange(
                              field.value?.filter(
                                (v: string) => v !== 'volunteers'
                              )
                            );
                      }}
                    />
                    <Label htmlFor="c2" className="cursor-pointer">
                      Identify potential volunteers/partners
                    </Label>
                  </>
                )}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="multiWinConnections"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Checkbox
                      id="c3"
                      checked={field.value?.includes('data')}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), 'data'])
                          : field.onChange(
                              field.value?.filter((v: string) => v !== 'data')
                            );
                      }}
                    />
                    <Label htmlFor="c3" className="cursor-pointer">
                      Collect data for impact reporting
                    </Label>
                  </>
                )}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="multiWinConnections"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Checkbox
                      id="c4"
                      checked={field.value?.includes('template')}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), 'template'])
                          : field.onChange(
                              field.value?.filter(
                                (v: string) => v !== 'template'
                              )
                            );
                      }}
                    />
                    <Label htmlFor="c4" className="cursor-pointer">
                      Test new process or template
                    </Label>
                  </>
                )}
              />
            </div>
            <Input
              {...form.register('otherConnection')}
              placeholder="Other..."
            />
          </div>
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <Label className="font-semibold text-base">
            Section 4: Resource & Support Check
          </Label>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Transport</Label>
                <Controller
                name="transport"
                control={form.control}
                render={({ field }) => (
                    <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Transport..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Needed">Needed</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                    </SelectContent>
                    </Select>
                )}
                />
            </div>
            <div className="space-y-2">
                <Label>Budget (UGX)</Label>
                <Input
                {...form.register('budget')}
                type="number"
                placeholder="e.g., 50000"
                />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Materials</Label>
            <Textarea
                {...form.register('materials')}
                placeholder="List required items..."
            />
          </div>
          <div className="space-y-2">
            <Label>Team Support</Label>
             <Controller
                name="teamSupport"
                control={form.control}
                render={({ field }) => (
                <MultiSelect
                    onValueChange={field.onChange}
                    defaultValue={field.value || []}
                >
                    <MultiSelectTrigger>
                    <MultiSelectValue placeholder="Select team members..." />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                    {teamMembers?.map((member) => (
                        <MultiSelectItem key={member.id} value={member.name}>
                        {member.name}
                        </MultiSelectItem>
                    ))}
                    </MultiSelectContent>
                </MultiSelect>
                )}
            />
          </div>
          <div className="space-y-2">
             <Label>Potential Challenges</Label>
            <Textarea
                {...form.register('challenges')}
                placeholder="What might go wrong? How can you prepare?"
            />
          </div>
        </section>
      </CardContent>
    </>
  );
}

function Step3({
  form,
  keyResults,
}: {
  form: any;
  keyResults: KeyResult[] | null;
}) {
  const { getValues } = form;
  const values = getValues();
  const mainFocus = values.mainFocus;
  const customTask = values.customTask;

  let mainFocusDisplay = 'N/A';
  if (mainFocus === 'custom') {
    mainFocusDisplay = customTask || 'Custom Task Not Specified';
  } else if (keyResults?.find((kr) => kr.id === mainFocus)) {
    const kr = keyResults.find((kr) => kr.id === mainFocus);
    mainFocusDisplay = kr ? `${kr.title}: ${kr.description}` : 'Selected KR not found';
  } else {
    mainFocusDisplay = mainFocus;
  }

  const supportNeeded = [
    values.transport && `Transport: ${values.transport}`,
    values.materials,
  ]
    .filter(Boolean)
    .join(', ');

  const timeBlocks =
    values.timeBlocks
      ?.map(
        (tb: { startTime: string; endTime:string, description: string }) =>
          `${tb.startTime}-${tb.endTime}: ${tb.description}`
      )
      .filter((v: string) => v.includes(':')) || [];

  const teamSupportNames = values.teamSupport?.join(', ');

  return (
    <>
      <CardHeader>
        <CardTitle>Daily Plan Summary</CardTitle>
        <CardDescription>
          Review your plan before starting your day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-semibold">Main Focus:</h4>
          <p className="text-muted-foreground">{mainFocusDisplay}</p>
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-semibold">Time Allocation:</h4>
          {timeBlocks.length > 0 ? (
            <ul className="list-disc list-inside text-muted-foreground">
              {timeBlocks.map((block: string, i: number) => (
                <li key={i}>{block}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No time blocks planned.</p>
          )}
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-semibold">Multi-Win Goals:</h4>
          <p className="text-muted-foreground">
            {values.multiWinConnections?.join(', ') || 'None'}
          </p>
          {values.otherConnection && (
            <p className="text-muted-foreground">
              Other: {values.otherConnection}
            </p>
          )}
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-semibold">Support Needed:</h4>
          <p className="text-muted-foreground">
            {supportNeeded || 'None specified'}
          </p>
          {teamSupportNames && (
            <p className="text-muted-foreground">Team: {teamSupportNames}</p>
          )}
          {values.budget > 0 && (
            <p className="text-muted-foreground">
              Budget: {values.budget.toLocaleString()} UGX
            </p>
          )}
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-semibold">Risk Mitigation:</h4>
          <p className="text-muted-foreground">
            {values.challenges || 'None specified'}
          </p>
        </div>
      </CardContent>
    </>
  );
}

export function CheckinForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const [location, setLocation] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(
          `${position.coords.latitude.toFixed(
            4
          )}, ${position.coords.longitude.toFixed(4)}`
        );
      },
      () => setLocation('Location access denied.')
    );
  }, []);

  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      multiWinConnections: [],
      budget: 0,
      timeBlocks: [],
      teamSupport: [],
    },
  });

  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'), orderBy('title'));
  }, [firestore]);

  const { data: keyResults, isLoading: isLoadingKR } =
    useCollection<KeyResult>(keyResultsQuery);
  
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return Timestamp.fromDate(d);
  }, []);

  const recentCheckoutQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, "checkouts"),
        where("userId", "==", user.uid),
        where("timestamp", ">=", yesterday),
        orderBy("timestamp", "desc"),
        limit(1)
    );
  }, [firestore, user, yesterday]);

  const { data: recentCheckouts } = useCollection<Checkout>(recentCheckoutQuery);
  const missionFromYesterday = recentCheckouts?.[0]?.tomorrowPlan;

  useEffect(() => {
    if (missionFromYesterday) {
        form.setValue('mainFocus', missionFromYesterday);
    }
  }, [missionFromYesterday, form]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('name'));
  }, [firestore]);
  const { data: teamMembers } = useCollection<User>(usersQuery);

  const selectedFocus = form.watch('mainFocus');
  const selectedKR = useMemo(
    () => keyResults?.find((kr) => kr.id === selectedFocus),
    [keyResults, selectedFocus]
  );

  const onSubmit = (data: CheckinFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    const { mainFocus, customTask } = data;
    let mission: string;

    if (mainFocus === 'custom') {
        mission = customTask || "Custom task";
    } else {
        const kr = keyResults?.find((k) => k.id === mainFocus);
        mission = kr ? `${kr.title}: ${kr.description}` : mainFocus;
    }


    const checkinData = {
      primaryMission: mission,
      details: data,
      userId: user.uid,
      name: profile.name,
      timestamp: serverTimestamp(),
    };

    const checkinsCollection = collection(firestore, 'checkins');
    addDocumentNonBlocking(checkinsCollection, checkinData);

    toast({
      title: 'Daily Plan Submitted!',
      description: 'Your strategic plan for the day is logged.',
    });
    form.reset();
    setCurrentStep(0);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;
    }
    if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <nav aria-label="Progress">
          <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0 p-6">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className="md:flex-1">
                {stepIdx < currentStep ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(stepIdx)}
                    className="group flex w-full flex-col border-l-4 border-primary py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                  >
                    <span className="text-sm font-medium text-primary transition-colors ">
                      {step.id}
                    </span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </button>
                ) : stepIdx === currentStep ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(stepIdx)}
                    className="flex w-full flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                    aria-current="step"
                  >
                    <span className="text-sm font-medium text-primary">
                      {step.id}
                    </span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(stepIdx)}
                    className="group flex w-full flex-col border-l-4 border-border py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                  >
                    <span className="text-sm font-medium text-muted-foreground transition-colors">
                      {step.id}
                    </span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </button>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {currentStep === 0 && <Step1 location={location} />}
        {currentStep === 1 && (
          <Step2
            form={form}
            keyResults={keyResults}
            isLoadingKR={isLoadingKR}
            selectedKR={selectedKR}
            teamMembers={teamMembers}
            profile={profile}
            missionFromYesterday={missionFromYesterday}
          />
        )}
        {currentStep === 2 && (
          <Step3
            form={form}
            keyResults={keyResults}
          />
        )}

        <CardFooter className="flex w-full justify-between gap-2 border-t pt-6">
          <Button
            type="button"
            onClick={handlePrev}
            size="sm"
            variant="secondary"
            disabled={currentStep === 0}
          >
            Prev
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNext} size="sm">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}{' '}
              Approve & Start Day
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
