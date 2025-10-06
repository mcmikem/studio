'use client';
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Loader2, Wand2, Sparkles, LogIn } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { dailyPlannerAI, DailyPlannerAIOutput } from '@/ai/flows/daily-planner-flow';
import { MultiSelect } from '../ui/multi-select';

const checkinSchema = z.object({
  mainFocus: z.array(z.string()).min(1, 'Please select at least one main focus.'),
  customTask: z.string().optional(),
  workLocation: z.string().min(1, "Please select your work location."),
  timeBlocks: z.array(
    z.object({
      startTime: z.string().min(1, 'Required'),
      endTime: z.string().min(1, 'Required'),
      description: z.string().min(3, 'Required'),
    })
  ).optional(),
  multiWinConnections: z.array(z.string()).optional(),
  otherConnection: z.string().optional(),
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
  
  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      mainFocus: [],
      customTask: '',
      workLocation: 'Office',
      multiWinConnections: [],
      budget: 0,
      timeBlocks: [],
      teamSupport: [],
      otherConnection: '',
      challenges: '',
    },
  });

  const [aiSuggestions, setAiSuggestions] = useState<DailyPlannerAIOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { watch, control, formState: { errors, isSubmitting } } = form;
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
            form.setValue('mainFocus', [lastCheckout.tomorrowPlan]);
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

  const onSubmit = (data: CheckinFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    
    let mission = data.mainFocus.map(focusId => {
      if (focusId === 'custom') return data.customTask;
      const kr = keyResults?.find(k => k.id === focusId);
      return kr ? `${kr.title}: ${kr.description}` : focusId;
    }).filter(Boolean).join('; ');

    const sanitizedDetails = {
      mainFocus: data.mainFocus || [],
      customTask: data.customTask || '',
      workLocation: data.workLocation || 'Not specified',
      timeBlocks: data.timeBlocks || [],
      multiWinConnections: data.multiWinConnections || [],
      otherConnection: data.otherConnection || '',
      teamSupport: data.teamSupport || [],
      budget: data.budget || 0,
      challenges: data.challenges || '',
    };

    const checkinData = {
      primaryMission: mission,
      details: sanitizedDetails,
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
    setAiSuggestions(null);
  };

  const handleBrainstorm = async () => {
    if (mainFocus.length === 0 || !profile) return;
    
    const tasks = mainFocus.map(focusId => {
      if (focusId === 'custom') return customTask;
      return keyResults?.find(kr => kr.id === focusId)?.description;
    }).filter(Boolean).join(', ');

    if (!tasks) {
        toast({ variant: "destructive", title: "Please select or define a task first." });
        return;
    }

    setIsAiLoading(true);
    setAiSuggestions(null);

    try {
        const suggestions = await dailyPlannerAI({ task: tasks, role: profile.role });
        setAiSuggestions(suggestions);
    } catch (error) {
        console.error("AI brainstorming error:", error);
        toast({ variant: "destructive", title: "AI Assistant Error", description: "Could not fetch suggestions." });
    } finally {
        setIsAiLoading(false);
    }
  };

  const krOptions = useMemo(() => {
    if (!keyResults) return [];
    return keyResults.map(kr => ({ value: kr.id, label: `${kr.title}: ${kr.description}`}));
  }, [keyResults]);


  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>AI-Powered Daily Check-in & Plan</CardTitle>
          <CardDescription>Strategize your day for maximum impact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <section className="space-y-4">
              <div className="flex justify-between items-center">
                  <Label className="font-semibold text-base">Priority Selection</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleBrainstorm} disabled={isAiLoading || mainFocus.length === 0}>
                      {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                      Brainstorm with AI
                  </Button>
              </div>
              <Controller
                name="mainFocus"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={[...krOptions, { value: 'custom', label: 'Custom Task' }]}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Select your main focus areas..."
                    animation={0}
                    maxCount={3}
                  />
                )}
              />
            {errors.mainFocus && <p className="text-sm text-destructive">{`${errors.mainFocus.message}`}</p>}
            {form.watch('mainFocus')?.includes('custom') && (<Input {...form.register('customTask')} placeholder="Type your custom task" className="mt-2"/>)}
            {isAiLoading && (<div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>AI is thinking...</span></div>)}
            {aiSuggestions && (
                <Card className="bg-primary/10 border-primary/50">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Suggestions</CardTitle></CardHeader>
                    <CardContent><ul className="list-disc list-inside space-y-2 text-sm">{aiSuggestions.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul></CardContent>
                </Card>
            )}
          </section>

          <section className="space-y-4">
            <Label className="font-semibold text-base">Logistics</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Work Location</Label>
                <Controller
                  name="workLocation"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select location..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Field">Field</SelectItem>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                 {errors.workLocation && <p className="text-sm text-destructive">{`${errors.workLocation.message}`}</p>}
              </div>
              <div className="space-y-2">
                <Label>Budget Required (UGX)</Label>
                <Input {...form.register('budget')} type="number" placeholder="e.g., 50000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Support Needed From</Label>
               <Controller
                name="teamSupport"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={teamMembers?.map(m => ({ value: m.name, label: m.name })) || []}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Select team members..."
                    animation={0}
                    maxCount={2}
                  />
                )}
              />
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
