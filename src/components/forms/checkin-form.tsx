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
} from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, query, orderBy, where, limit, Timestamp, getDocs } from 'firebase/firestore';
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
import { Loader2, PlusCircle, X, Wand2, Sparkles, LogIn } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Badge } from '../ui/badge';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '../ui/multi-select';
import { dailyPlannerAI, DailyPlannerAIOutput } from '@/ai/flows/daily-planner-flow';

const timeOptions = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM',
];

const checkinSchema = z.object({
  mainFocus: z.string().min(1, 'Please select a main focus.'),
  customTask: z.string().optional(),
  timeBlocks: z.array(
    z.object({
      startTime: z.string().min(1, 'Required'),
      endTime: z.string().min(1, 'Required'),
      description: z.string().min(3, 'Required'),
    })
  ).optional(),
  multiWinConnections: z.array(z.string()).optional(),
  otherConnection: z.string().optional(),
  transport: z.string().optional(),
  materials: z.string().optional(),
  teamSupport: z.array(z.string()).optional(),
  budget: z.coerce.number().optional(),
  challenges: z.string().optional(),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

export function CheckinForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const [missionFromYesterday, setMissionFromYesterday] = useState<string | null>(null);
  
  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      multiWinConnections: [],
      budget: 0,
      timeBlocks: [],
      teamSupport: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'timeBlocks',
  });

  const [aiSuggestions, setAiSuggestions] = useState<DailyPlannerAIOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { watch, formState: { errors, isSubmitting } } = form;
  const mainFocus = watch('mainFocus');
  const customTask = watch('customTask');
  
  const keyResultsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'), orderBy('title'));
  }, [firestore]);

  const { data: keyResults, isLoading: isLoadingKR } = useCollection<KeyResult>(keyResultsQuery);
  
  useEffect(() => {
    async function fetchLastCheckout() {
      if (!firestore || !user) return;
  
      const checkoutQuery = query(
        collection(firestore, 'checkouts'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
  
      try {
        const querySnapshot = await getDocs(checkoutQuery);
        if (!querySnapshot.empty) {
          const lastCheckout = querySnapshot.docs[0].data() as Checkout;
          if (lastCheckout.tomorrowPlan) {
            setMissionFromYesterday(lastCheckout.tomorrowPlan);
            form.setValue('mainFocus', lastCheckout.tomorrowPlan);
          }
        }
      } catch (error) {
        console.error("Error fetching last checkout:", error);
      }
    }
    fetchLastCheckout();
  }, [firestore, user, form]);

  const usersQuery = useMemo(() => {
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
  };

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
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>AI-Powered Daily Check-in & Plan</CardTitle>
          <CardDescription>Strategize your day for maximum impact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Section 1: Priority Selection */}
          <section className="space-y-4 rounded-lg border p-4">
              <div className="flex justify-between items-center">
                  <Label className="font-semibold text-base">Section 1: Priority Selection</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleBrainstorm} disabled={isAiLoading || !mainFocus}>
                      {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                      Brainstorm with AI
                  </Button>
              </div>
              <Controller
                name="mainFocus"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger><SelectValue placeholder="Select your main focus..." /></SelectTrigger>
                    <SelectContent>
                      {isLoadingKR ? <SelectItem value="loading" disabled>Loading...</SelectItem> : (
                        <>
                          {missionFromYesterday && <SelectItem value={missionFromYesterday}>{missionFromYesterday}</SelectItem>}
                          {keyResults?.map((kr) => (<SelectItem key={kr.id} value={kr.id}>{kr.title}: {kr.description}</SelectItem>))}
                        </>
                      )}
                      <SelectItem value="custom">Custom Task</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            {errors.mainFocus && <p className="text-sm text-destructive">{`${errors.mainFocus.message}`}</p>}
            {form.watch('mainFocus') === 'custom' && (<Input {...form.register('customTask')} placeholder="Type your custom task" className="mt-2"/>)}
            {selectedKR && (
              <Card className="mt-2 bg-muted/50 p-4 text-sm">
                <CardHeader className="p-0 mb-2"><CardTitle className="text-base">{selectedKR.title}: {selectedKR.description}</CardTitle></CardHeader>
                <CardContent className="p-0 space-y-1">
                  <p><strong>Current Progress:</strong> {selectedKR.currentProgress} of {selectedKR.target} completed</p>
                  <p><strong>Priority:</strong> <Badge variant={selectedKR.priority === 'High' ? 'destructive' : 'secondary'}>{selectedKR.priority}</Badge></p>
                </CardContent>
              </Card>
            )}
            {isAiLoading && (<div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>AI is thinking...</span></div>)}
            {aiSuggestions && (
                <Card className="bg-primary/10 border-primary/50">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Suggestions</CardTitle></CardHeader>
                    <CardContent><ul className="list-disc list-inside space-y-2 text-sm">{aiSuggestions.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul></CardContent>
                </Card>
            )}
          </section>

          {/* Section 2: Time-Blocked Planning */}
          <section className="space-y-4 rounded-lg border p-4">
            <Label className="font-semibold text-base">Section 2: Time-Blocked Planning</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row items-end gap-2">
                <div className="grid grid-cols-2 gap-2 flex-grow w-full sm:w-auto">
                   <div className="space-y-1">
                      <Label htmlFor={`start-time-${index}`} className="text-xs">Start</Label>
                      <Controller name={`timeBlocks.${index}.startTime`} control={form.control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger id={`start-time-${index}`}><SelectValue placeholder="Start" /></SelectTrigger><SelectContent>{timeOptions.map((t) => (<SelectItem key={t + '-start'} value={t}>{t}</SelectItem>))}</SelectContent></Select>)}/>
                   </div>
                   <div className="space-y-1">
                      <Label htmlFor={`end-time-${index}`} className="text-xs">End</Label>
                      <Controller name={`timeBlocks.${index}.endTime`} control={form.control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger id={`end-time-${index}`}><SelectValue placeholder="End" /></SelectTrigger><SelectContent>{timeOptions.map((t) => (<SelectItem key={t + '-end'} value={t}>{t}</SelectItem>))}</SelectContent></Select>)}/>
                   </div>
                </div>
                <div className="flex-grow space-y-1 w-full sm:w-auto">
                  <Label htmlFor={`desc-${index}`} className="text-xs">Description</Label>
                  <Input {...form.register(`timeBlocks.${index}.description`)} placeholder="Activity description" id={`desc-${index}`}/>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ startTime: '', endTime: '', description: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Time Block</Button>
          </section>

          {/* Section 3: Multi-Win Connection */}
          <section className="space-y-4 rounded-lg border p-4">
            <Label className="font-semibold text-base">Section 3: Multi-Win Connection</Label>
            <div className="space-y-2">
              {[
                { id: 'photos', label: 'Capture photos/video for Omuto Pulse' },
                { id: 'volunteers', label: 'Identify potential volunteers/partners' },
                { id: 'data', label: 'Collect data for impact reporting' },
                { id: 'template', label: 'Test new process or template' }
              ].map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Controller name="multiWinConnections" control={form.control} render={({ field }) => (<Checkbox id={item.id} checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((v: string) => v !== item.id))}}/>)} />
                  <Label htmlFor={item.id} className="cursor-pointer">{item.label}</Label>
                </div>
              ))}
              <Input {...form.register('otherConnection')} placeholder="Other..." />
            </div>
          </section>

          {/* Section 4: Resource & Support Check */}
          <section className="space-y-4 rounded-lg border p-4">
            <Label className="font-semibold text-base">Section 4: Resource & Support Check</Label>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label>Transport</Label>
                  <Controller name="transport" control={form.control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Transport..." /></SelectTrigger><SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Needed">Needed</SelectItem><SelectItem value="Confirmed">Confirmed</SelectItem></SelectContent></Select>)}/>
              </div>
              <div className="space-y-2">
                  <Label>Budget (UGX)</Label>
                  <Input {...form.register('budget')} type="number" placeholder="e.g., 50000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Materials</Label>
              <Textarea {...form.register('materials')} placeholder="List required items..." />
            </div>
            <div className="space-y-2">
              <Label>Team Support</Label>
               <Controller name="teamSupport" control={form.control} render={({ field }) => (<MultiSelect onValueChange={field.onChange} defaultValue={field.value || []}><MultiSelectTrigger><MultiSelectValue placeholder="Select team members..." /></MultiSelectTrigger><MultiSelectContent>{teamMembers?.map((member) => (<MultiSelectItem key={member.id} value={member.name}>{member.name}</MultiSelectItem>))}</MultiSelectContent></MultiSelect>)}/>
            </div>
            <div className="space-y-2">
               <Label>Potential Challenges</Label>
              <Textarea {...form.register('challenges')} placeholder="What might go wrong? How can you prepare?" />
            </div>
          </section>
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (<Loader2 className="mr-2 h-5 w-5 animate-spin" />) : (<LogIn className="mr-2 h-5 w-5" />)}
            Submit Daily Plan
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
