

'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, BarChart3 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ImpactMetric, Program, KeyResult } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const multipliers = [
  { id: 'combine', label: 'Combining with another activity', value: 15000 },
  { id: 'train', label: 'Training volunteer to lead next time', value: 25000 },
  { id: 'content', label: 'Capturing content for fundraising', value: 50000 },
  { id: 'process', label: 'Testing new process for replication', value: 30000 },
];

interface ProgramActivityFormProps {
    programTitle: string;
    formDescription: string;
    showParentsAttended?: boolean;
    showTeachersAttended?: boolean;
    showTreesPlanted?: boolean;
}

export function ProgramActivityForm({ 
    programTitle, 
    formDescription,
    showParentsAttended = false,
    showTeachersAttended = false,
    showTreesPlanted = false,
}: ProgramActivityFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get('programId');

  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("planning");

  const [activityName, setActivityName] = useState('');
  const [ecosystemPhase, setEcosystemPhase] = useState<"Identify & Inspire" | "Equip & Empower" | "Activate & Sustain">('Identify & Inspire');
  const [transportCost, setTransportCost] = useState(15000);
  const [staffTimeCost, setStaffTimeCost] = useState(20000);
  const [materialsCost, setMaterialsCost] = useState(10000);
  const [selectedMultipliers, setSelectedMultipliers] = useState<string[]>([]);
  const [actualCost, setActualCost] = useState(45000);
  
  const [goalQuantity, setGoalQuantity] = useState(1);
  const [keyResultId, setKeyResultId] = useState<string | null>(null);

  // Program-specific fields
  const [parentsAttended, setParentsAttended] = useState(0);
  const [teachersAttended, setTeachersAttended] = useState(0);
  const [treesPlanted, setTreesPlanted] = useState(0);

  // Narrative fields
  const [memorableMoment, setMemorableMoment] = useState('');
  const [challengesLearned, setChallengesLearned] = useState('');
  const [beneficiaryQuote, setBeneficiaryQuote] = useState('');

  const programDocRef = useMemoFirebase(() => {
    if (!firestore || !programId) return null;
    return doc(firestore, 'programs', programId);
  }, [firestore, programId]);

  const { data: program, isLoading: isLoadingProgram } = useDoc<Program>(programDocRef);

  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'), orderBy('title'));
  }, [firestore]);
  const { data: keyResults, isLoading: isLoadingKeyResults } = useCollection<KeyResult>(keyResultsQuery);

  const preActivityCost = useMemo(
    () => transportCost + staffTimeCost + materialsCost,
    [transportCost, staffTimeCost, materialsCost]
  );
  
  useEffect(() => {
    setActualCost(preActivityCost);
  }, [preActivityCost]);

  const indirectValue = useMemo(() => {
    return multipliers.reduce(
      (total, m) =>
        selectedMultipliers.includes(m.id) ? total + m.value : total,
      0
    );
  }, [selectedMultipliers]);
  
  const directValue = useMemo(() => {
    if (program && program.valuePerObjective) {
      return goalQuantity * program.valuePerObjective;
    }
    return 0;
  }, [program, goalQuantity]);

  const totalValue = useMemo(
    () => directValue + indirectValue,
    [directValue, indirectValue]
  );

  const estimatedRoi = useMemo(() => {
    if (preActivityCost === 0) return 0;
    return ((totalValue - preActivityCost) / preActivityCost) * 100;
  }, [totalValue, preActivityCost]);

  const finalRoi = useMemo(() => {
    if (actualCost === 0) return 0;
    return ((totalValue - actualCost) / actualCost) * 100;
  }, [totalValue, actualCost]);

  const handleMultiplierChange = (id: string, checked: boolean) => {
    setSelectedMultipliers((prev) =>
      checked ? [...prev, id] : prev.filter((mId) => mId !== id)
    );
  };

  const handleLogActivity = async () => {
    if (!activityName.trim() || !user || !firestore || !programId || !profile || !keyResultId) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide an activity name, link to a Key Result, and be logged in to save.',
      });
      return;
    }
    setLoading(true);

    const activityData: any = {
      title: activityName,
      userId: user.uid,
      userName: profile.name,
      ecosystem_phase: ecosystemPhase,
      estimatedCost: preActivityCost,
      actualCost: actualCost,
      directValue: directValue,
      indirectValue: indirectValue,
      totalValue: totalValue,
      estimatedRoi: estimatedRoi,
      finalRoi: finalRoi,
      loggedAt: serverTimestamp(),
      primaryGoalType: 'Program',
      primaryGoalId: programId,
      primaryGoalQuantity: goalQuantity,
      keyResultId: keyResultId,
      memorableMoment: memorableMoment,
      challengesLearned: challengesLearned,
      beneficiaryQuote: beneficiaryQuote,
    };

    if (showParentsAttended) activityData.parents_attended = parentsAttended;
    if (showTeachersAttended) activityData.teachers_attended = teachersAttended;
    if (showTreesPlanted) activityData.trees_planted = treesPlanted;

    const activitiesCollection = collection(firestore, 'activities');
    
    try {
        await addDocumentNonBlocking(activitiesCollection, activityData);
        toast({
          title: 'Activity Logged!',
          description: `${activityName} has been saved.`,
        });
        router.push(`/management/programs/${programId}`);

    } catch(e) {
        console.error(e);
        toast({
            variant: 'destructive',
            title: 'Save Error',
            description: 'Could not log your activity. Please try again.',
        });
    } finally {
        setLoading(false);
    }
  };
  
  if (isLoadingProgram) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!program) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Program Not Found</CardTitle>
                  <CardDescription>The program associated with this form could not be found. Please go back and select a valid program.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button asChild variant="outline"><Link href="/meal"><ArrowLeft className="mr-2 h-4 w-4" />Back to MEAL Hub</Link></Button>
              </CardContent>
          </Card>
      )
  }
  
  return (
      <Card className="border-lg shadow-comic-sm">
           <CardHeader className="p-5 sm:p-8 border-b-lg border-muted">
            <div className='flex items-center gap-4'>
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-xl sm:text-3xl">{programTitle} Activity Report</CardTitle>
                    <CardDescription>{formDescription}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="planning">1. Planning</TabsTrigger>
                    <TabsTrigger value="execution">2. Execution</TabsTrigger>
                    <TabsTrigger value="logging">3. Logging</TabsTrigger>
                </TabsList>
                <TabsContent value="planning" className="pt-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="activityName">Activity Name</Label>
                        <Input
                          id="activityName"
                          placeholder="e.g., Tree Planting @ Greenhill"
                          value={activityName}
                          onChange={(e) => setActivityName(e.target.value)}
                        />
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="ecosystemPhase">Ecosystem Phase</Label>
                          <Select onValueChange={(value: "Identify & Inspire" | "Equip & Empower" | "Activate & Sustain") => setEcosystemPhase(value)} value={ecosystemPhase}>
                              <SelectTrigger id="ecosystemPhase"><SelectValue placeholder="Select phase..." /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Identify & Inspire">Identify & Inspire</SelectItem>
                                  <SelectItem value="Equip & Empower">Equip & Empower</SelectItem>
                                  <SelectItem value="Activate & Sustain">Activate & Sustain</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <Separator />
                      <h3 className="font-semibold">Primary Goal</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <div className="sm:col-span-2 space-y-2">
                              <Label>Program</Label>
                              <Input value={program.title} disabled />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="program-quantity">Objectives Completed</Label>
                              <Input id="program-quantity" type="number" placeholder="e.g., 1" value={goalQuantity} onChange={e => setGoalQuantity(Number(e.target.value))} />
                          </div>
                       </div>
                      
                      {showParentsAttended && (
                          <div className="space-y-2">
                              <Label htmlFor="parents-attended">Parents Attended</Label>
                              <Input id="parents-attended" type="number" placeholder="e.g., 25" value={parentsAttended} onChange={e => setParentsAttended(Number(e.target.value))} />
                          </div>
                      )}
                      {showTeachersAttended && (
                          <div className="space-y-2">
                              <Label htmlFor="teachers-attended">Teachers Attended</Label>
                              <Input id="teachers-attended" type="number" placeholder="e.g., 5" value={teachersAttended} onChange={e => setTeachersAttended(Number(e.target.value))} />
                          </div>
                      )}
                      {showTreesPlanted && (
                          <div className="space-y-2">
                              <Label htmlFor="trees-planted">Trees Planted</Label>
                              <Input id="trees-planted" type="number" placeholder="e.g., 150" value={treesPlanted} onChange={e => setTreesPlanted(Number(e.target.value))} />
                          </div>
                      )}
                      
                       <div className="p-4 bg-muted rounded-lg">
                          <div className="flex justify-between items-center text-md">
                              <span className="text-muted-foreground">Direct Value (from Goal):</span>
                              <span className="font-bold">{formatCurrency(directValue)}</span>
                          </div>
                       </div>

                      <Button type="button" onClick={() => setCurrentTab("execution")} className="w-full">Next: Plan Execution</Button>
                    </div>
                </TabsContent>
                 <TabsContent value="execution" className="pt-6">
                      <div className="space-y-6">
                          <h3 className="font-semibold text-lg">Estimated Costs</h3>
                          <div className="space-y-4">
                              <div className="space-y-2"><Label htmlFor="transportCost">Transport</Label><Input id="transportCost" type="number" step="1000" value={transportCost} onChange={(e) => setTransportCost(Number(e.target.value))} /></div>
                              <div className="space-y-2"><Label htmlFor="staffTimeCost">Staff Time</Label><Input id="staffTimeCost" type="number" step="1000" value={staffTimeCost} onChange={(e) => setStaffTimeCost(Number(e.target.value))} /></div>
                              <div className="space-y-2"><Label htmlFor="materialsCost">Materials</Label><Input id="materialsCost" type="number" step="1000" value={materialsCost} onChange={(e) => setMaterialsCost(Number(e.target.value))} /></div>
                          </div>
                          <div className="text-right font-bold text-lg p-2 bg-muted rounded-md">Total Estimated Cost: {formatCurrency(preActivityCost)}</div>
                          <Separator />
                          <h3 className="font-semibold text-lg">Value Multipliers (Multiple Wins)</h3>
                          <div className="space-y-3 pt-2">
                              {multipliers.map((m) => (
                                  <div key={m.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                                  <Checkbox id={m.id} onCheckedChange={(checked) => handleMultiplierChange(m.id, !!checked)} checked={selectedMultipliers.includes(m.id)} />
                                  <Label htmlFor={m.id} className="flex-1 cursor-pointer">{m.label} <span className="text-muted-foreground text-xs">({formatCurrency(m.value)})</span></Label>
                                  </div>
                              ))}
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                              <div className="flex justify-between items-center text-md">
                                  <span className="text-muted-foreground">Indirect Value (from Multipliers):</span>
                                  <span className="font-bold">{formatCurrency(indirectValue)}</span>
                              </div>
                          </div>
                           <Button type="button" onClick={() => setCurrentTab("logging")} className="w-full">Next: Log Results</Button>
                      </div>
                </TabsContent>
                <TabsContent value="logging" className="pt-6">
                    <div className="space-y-6">
                      <div className="space-y-4 pt-2 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg">
                        <div className="flex justify-between items-center text-lg">
                          <span className="text-muted-foreground">Total Estimated Value:</span>
                          <span className="font-bold">{formatCurrency(totalValue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-2xl">
                          <span className="font-headline">Estimated ROI:</span>
                          <span className={`font-bold font-headline ${estimatedRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>{estimatedRoi.toFixed(0)}%</span>
                        </div>
                      </div>

                       <div className="space-y-2">
                          <Label htmlFor="key-result">Link to Key Result</Label>
                          {isLoadingKeyResults ? <Skeleton className="h-10 w-full" /> : (
                              <Select onValueChange={setKeyResultId} value={keyResultId || undefined}>
                                  <SelectTrigger id="key-result">
                                      <SelectValue placeholder="Select a Key Result..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {keyResults?.map(kr => (
                                          <SelectItem key={kr.id} value={kr.id}>{kr.title}: {kr.description}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="actualCost">Actual Final Cost</Label>
                        <Input id="actualCost" type="number" value={actualCost} onChange={(e) => setActualCost(Number(e.target.value))} placeholder="e.g., 42000"/>
                      </div>

                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Post-Activity Debrief & Story</h3>
                        <div className="space-y-2"><Label htmlFor="memorableMoment">Memorable Moment</Label><Textarea id="memorableMoment" placeholder="Describe a specific, powerful interaction or observation." value={memorableMoment} onChange={(e) => setMemorableMoment(e.target.value)}/></div>
                        <div className="space-y-2"><Label htmlFor="challengesLearned">Challenges & Lessons Learned</Label><Textarea id="challengesLearned" placeholder="What was a surprising challenge and how did you overcome it?" value={challengesLearned} onChange={(e) => setChallengesLearned(e.target.value)}/></div>
                        <div className="space-y-2"><Label htmlFor="beneficiaryQuote">Quote from a Beneficiary</Label><Textarea id="beneficiaryQuote" placeholder='e.g., "I never knew I could make my own pads before today!" - Jane' value={beneficiaryQuote} onChange={(e) => setBeneficiaryQuote(e.target.value)}/></div>
                      </div>

                      <Separator />

                      <div className="space-y-4 pt-2 bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                         <div className="flex justify-between items-center text-2xl pt-4">
                          <span className="font-headline">Final ROI:</span>
                          <span className={`font-bold font-headline ${finalRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>{finalRoi.toFixed(0)}%</span>
                        </div>
                      </div>
                      <Button type="button" className="w-full" size="lg" onClick={handleLogActivity} disabled={loading || !activityName.trim()}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Log this Activity &amp; ROI
                      </Button>
                    </div>
                </TabsContent>
            </Tabs>
          </CardContent>
      </Card>
  );
}
