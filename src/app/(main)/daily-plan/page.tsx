
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Wand, ThumbsUp, ThumbsDown, Check, ArrowRight, Target, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { DailyPlannerAIOutput, KeyResult } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { generateDailyPlanAction as runDailyPlanner } from '@/actions/mutations';
import { formatDateSafe } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';

export default function DailyPlannerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const [primaryMission, setPrimaryMission] = useState('');
  const [mood, setMood] = useState<'good' | 'neutral' | 'bad' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [workingStartTime, setWorkingStartTime] = useState('08:30');
  const [workingEndTime, setWorkingEndTime] = useState('17:00');
  const [aiPlan, setAiPlan] = useState<DailyPlannerAIOutput | null>(null);
  const [editablePlan, setEditablePlan] = useState<DailyPlannerAIOutput | null>(null);

  const firestore = useFirestore();
  const keyResultsQuery = useMemoFirebase((db) => db ? query(collection(db, 'key-results'), orderBy('priority')) : null, []);
  const { data: keyResults, isLoading: isLoadingKRs } = useCollection<KeyResult>(keyResultsQuery);
  
  const weeklyPlanQuery = useMemoFirebase((db) => user && db ? query(collection(db, 'weekly-plans'), orderBy('weekOf', 'desc')) : null, [user]);
  const { data: weeklyPlans } = useCollection<any>(weeklyPlanQuery);
  const currentWeeklyPlan = useMemo(() => weeklyPlans?.[0], [weeklyPlans]);


  const generatePlan = async () => {
    if (!primaryMission.trim() || !mood) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter your primary mission and select your mood.',
      });
      return;
    }
    if (!profile || !keyResults) {
        toast({ variant: 'destructive', title: 'Data not loaded', description: 'User profile or key results are not available yet.' });
        return;
    }
    setIsLoading(true);
    setAiPlan(null);
    try {
      const result = await runDailyPlanner({
        userName: profile.name,
        userRole: profile.role,
        primaryMission: primaryMission,
        weeklyPriorities: currentWeeklyPlan?.teamPriorities?.map((p: any) => p.activity) || [],
        keyResults: keyResults.map(kr => ({ title: kr.title, description: kr.description, deadline: formatDateSafe(kr.deadline, 'dateOnly') })),
        workingStartTime,
        workingEndTime,
      });
      setAiPlan(result);
      setEditablePlan(result);
      toast({
        title: 'Plan Built!',
        description: 'Your strategic plan for the day is ready. Review and submit it.',
      });
    } catch (error) {
      console.error('Plan generation error:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not compute your plan. Please check your connection or try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeBlockChange = (index: number, field: 'startTime' | 'endTime' | 'description', value: string) => {
    if (!editablePlan) return;
    const newBlocks = [...editablePlan.timeBlocks];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setEditablePlan({ ...editablePlan, timeBlocks: newBlocks });
  };

  const addTimeBlock = () => {
    if (!editablePlan) return;
    setEditablePlan({
        ...editablePlan,
        timeBlocks: [...editablePlan.timeBlocks, { startTime: "09:00", endTime: "10:00", description: "New Task" }]
    });
  };

  const removeTimeBlock = (index: number) => {
    if (!editablePlan) return;
    setEditablePlan({
        ...editablePlan,
        timeBlocks: editablePlan.timeBlocks.filter((_, i) => i !== index)
    });
  };

  const submitCheckin = () => {
    if (!editablePlan || !mood || !primaryMission) return;
    const planData = {
      primaryMission,
      mood,
      workingStartTime,
      workingEndTime,
      details: editablePlan,
    };
    const encodedPlan = encodeURIComponent(JSON.stringify(planData));
    router.push(`/forms/check-in?plan=${encodedPlan}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Strategic Daily Planner" 
        description="Start your day with a strategic plan generated based on your mission and OKRs."
        icon={Sparkles}
        breadcrumbs={[
            { name: 'Check-in', href: '/checkins' },
            { name: 'Daily Planner', href: '/daily-plan' }
        ]}
      />

      {!aiPlan ? (
        <Card className="rounded-[2rem] border-lg border-omuto-navy shadow-comic-sm bg-white overflow-hidden">
          <CardHeader className="bg-omuto-cream/30 border-b-lg border-omuto-navy/5 pb-4 pt-7 px-8">
            <CardTitle className="font-heading text-2xl font-black tracking-tighter text-omuto-navy uppercase">Morning Briefing</CardTitle>
            <CardDescription className="font-bold text-omuto-navy/40 text-[10px] uppercase tracking-[0.2em] mt-1">Enter your main objective for today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="primaryMission" className="font-bold text-lg">What is your #1 mission for today?</Label>
              <Textarea
                id="primaryMission"
                placeholder="e.g., 'Finalize the RED Campaign report' or 'Conduct a site visit at St. Mary\'s School...'"
                className="min-h-[100px] border-lg rounded-2xl p-4 text-omuto-navy font-bold"
                value={primaryMission}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrimaryMission(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startTime" className="font-bold text-sm uppercase">Work Start</Label>
                    <Input 
                        id="startTime" 
                        type="time" 
                        value={workingStartTime} 
                        onChange={(e) => setWorkingStartTime(e.target.value)}
                        className="h-12 border-lg rounded-xl font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endTime" className="font-bold text-sm uppercase">Work End</Label>
                    <Input 
                        id="endTime" 
                        type="time" 
                        value={workingEndTime} 
                        onChange={(e) => setWorkingEndTime(e.target.value)}
                        className="h-12 border-lg rounded-xl font-bold"
                    />
                </div>
            </div>
            <div className="space-y-3">
                <Label className="font-bold text-lg">How are you feeling?</Label>
                <div className="flex gap-4">
                    <Button variant={mood === 'good' ? 'default' : 'outline'} onClick={() => setMood('good')} className="h-16 flex-1 rounded-2xl border-lg gap-2"><ThumbsUp /> Good</Button>
                    <Button variant={mood === 'neutral' ? 'default' : 'outline'} onClick={() => setMood('neutral')} className="h-16 flex-1 rounded-2xl border-lg gap-2">Neutral</Button>
                    <Button variant={mood === 'bad' ? 'default' : 'outline'} onClick={() => setMood('bad')} className="h-16 flex-1 rounded-2xl border-lg gap-2"><ThumbsDown /> Bad</Button>
                </div>
            </div>
            <Button
              className="btn-omuto w-full h-16 text-lg rounded-2xl shadow-comic-sm hover:shadow-comic transition-all"
              onClick={generatePlan}
              disabled={isLoading || isLoadingKRs}
            >
              {isLoading || isLoadingKRs ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Sparkles className="mr-3 h-5 w-5" />}
              Build My Strategic Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[2rem] border-lg border-omuto-navy shadow-comic-sm bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-omuto-navy text-white pb-6 pt-8 px-8 border-b-4 border-omuto-red flex flex-col justify-center">
            <CardTitle className="font-heading text-2xl font-black tracking-tighter uppercase leading-none">Your Strategic Daily Plan</CardTitle>
            <CardDescription className="text-white/60 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Review your mission-critical schedule for today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="p-6 bg-omuto-navy text-white rounded-3xl shadow-comic">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-2">Primary Mission</h3>
                <p className="font-heading text-2xl font-black italic">{primaryMission}</p>
            </div>
            
            {aiPlan.strategicAlignments && aiPlan.strategicAlignments.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/50 flex items-center gap-2 px-1">
                        <Target className="h-4 w-4 text-omuto-red" /> Strategic Alignment
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {aiPlan.strategicAlignments?.map((align, i) => (
                            <div key={i} className="p-5 bg-white rounded-[1.5rem] border-2 border-omuto-navy/10 shadow-sm hover:border-omuto-navy/20 transition-all">
                                <p className="font-black text-[9px] uppercase tracking-wider text-omuto-red mb-2">{align.krTitle}</p>
                                <p className="text-xs font-bold text-omuto-navy leading-relaxed">{align.alignmentJustification}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/50">Time Blocks</h4>
                        <Button variant="outline" size="sm" onClick={addTimeBlock} className="h-7 text-[9px] font-black uppercase tracking-widest border-2 border-omuto-navy/20 rounded-full hover:bg-omuto-navy hover:text-white transition-all">
                            <Plus className="h-3 w-3 mr-1" /> Add Task
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {editablePlan?.timeBlocks?.map((block, i) => (
                            <div key={i} className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-start p-5 bg-white rounded-[1.5rem] border-2 border-omuto-navy/5 hover:border-omuto-navy/15 transition-all group relative shadow-sm">
                                <div className="flex sm:flex-col gap-2 w-full sm:w-32">
                                    <div className="flex-1 sm:flex-none">
                                        <Label className="text-[9px] font-black uppercase text-omuto-navy/40 mb-1 block">Start</Label>
                                        <Input 
                                            value={block.startTime} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeBlockChange(i, 'startTime', e.target.value)}
                                            className="h-10 sm:h-9 text-xs font-black text-omuto-navy bg-omuto-cream/20 border-lg rounded-xl text-center"
                                        />
                                    </div>
                                    <div className="flex-1 sm:flex-none">
                                        <Label className="text-[9px] font-black uppercase text-omuto-navy/40 mb-1 block">End</Label>
                                        <Input 
                                            value={block.endTime} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeBlockChange(i, 'endTime', e.target.value)}
                                            className="h-10 sm:h-9 text-xs font-black text-omuto-navy bg-omuto-cream/20 border-lg rounded-xl text-center"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-omuto-navy/40 mb-1 block">Task Description</Label>
                                    <Textarea 
                                        value={block.description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTimeBlockChange(i, 'description', e.target.value)}
                                        className="min-h-[100px] sm:min-h-[82px] text-sm font-bold text-omuto-navy bg-white border-lg rounded-xl resize-none leading-relaxed"
                                    />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeTimeBlock(i)}
                                    className="absolute -top-2 -right-2 sm:static h-8 w-8 rounded-full bg-background sm:bg-transparent shadow-sm sm:shadow-none text-muted-foreground hover:text-omuto-red sm:opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {(!editablePlan?.timeBlocks || editablePlan.timeBlocks.length === 0) && (
                            <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/10 rounded-2xl border-2 border-dashed">
                                No time blocks generated. Tap "Add Task" to create one.
                            </p>
                        )}
                    </div>
                </div>
                  <div className="space-y-4">
                    <div>
                        <h4 className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/40 mb-2 px-1">Key Resources</h4>
                        <div className="p-4 bg-omuto-cream/20 border-lg rounded-[1.25rem] font-bold text-sm text-omuto-navy/80 leading-relaxed shadow-sm">
                            {aiPlan.materials}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/40 mb-2 px-1">Potential Challenges</h4>
                        <div className="p-4 bg-rose-50/50 border-2 border-rose-100 rounded-[1.25rem] font-bold text-sm text-rose-900/80 leading-relaxed">
                            {aiPlan.challenges}
                        </div>
                    </div>
                    <div className="pt-2">
                        <div className="p-5 bg-omuto-yellow/10 rounded-[1.25rem] border-lg border-omuto-yellow shadow-comic-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Wand className="h-4 w-4 text-omuto-brown" />
                                <h4 className="font-black uppercase text-[10px] tracking-widest text-omuto-brown">Best Practice Tip</h4>
                            </div>
                            <p className="text-sm font-bold text-omuto-brown leading-relaxed italic">{aiPlan.bestPractice}</p>
                        </div>
                    </div>
                 </div>
            </div>
            <Button className="btn-omuto w-full h-16 text-lg rounded-2xl shadow-comic hover:shadow-comic-lg transition-all" onClick={submitCheckin}>
                <Check className="mr-3 h-6 w-6" /> SUBMIT AS MY CHECK-IN
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
