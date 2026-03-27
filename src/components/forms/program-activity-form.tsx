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
import { LocationPicker } from '@/components/ui/location-picker';
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
  
  const [district, setDistrict] = useState('Wakiso');
  const [subcounty, setSubcounty] = useState('');
  const [parish, setParish] = useState('');

  const [goalQuantity, setGoalQuantity] = useState(1);
  const [keyResultId, setKeyResultId] = useState<string | null>(null);

  const [parentsAttended, setParentsAttended] = useState(0);
  const [teachersAttended, setTeachersAttended] = useState(0);
  const [treesPlanted, setTreesPlanted] = useState(0);

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

  const [finalRoi, setFinalRoi] = useState(0);

  useEffect(() => {
    if (actualCost === 0) {
      setFinalRoi(0);
    } else {
      setFinalRoi(((totalValue - actualCost) / actualCost) * 100);
    }
  }, [totalValue, actualCost]);

  const draftKey = useMemo(() => `omuto_draft_activity_${programId || 'new'}`, [programId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activityName) setActivityName(parsed.activityName);
        if (parsed.ecosystemPhase) setEcosystemPhase(parsed.ecosystemPhase);
        if (parsed.transportCost) setTransportCost(parsed.transportCost);
        if (parsed.staffTimeCost) setStaffTimeCost(parsed.staffTimeCost);
        if (parsed.materialsCost) setMaterialsCost(parsed.materialsCost);
        if (parsed.selectedMultipliers) setSelectedMultipliers(parsed.selectedMultipliers);
        if (parsed.actualCost) setActualCost(parsed.actualCost);
        if (parsed.goalQuantity) setGoalQuantity(parsed.goalQuantity);
        if (parsed.keyResultId) setKeyResultId(parsed.keyResultId);
        if (parsed.parentsAttended) setParentsAttended(parsed.parentsAttended);
        if (parsed.teachersAttended) setTeachersAttended(parsed.teachersAttended);
        if (parsed.treesPlanted) setTreesPlanted(parsed.treesPlanted);
        if (parsed.memorableMoment) setMemorableMoment(parsed.memorableMoment);
        if (parsed.challengesLearned) setChallengesLearned(parsed.challengesLearned);
        if (parsed.beneficiaryQuote) setBeneficiaryQuote(parsed.beneficiaryQuote);
        if (parsed.district) setDistrict(parsed.district);
        if (parsed.subcounty) setSubcounty(parsed.subcounty);
        if (parsed.parish) setParish(parsed.parish);
        
        toast({
          title: "Draft Restored",
          description: "We restored your unsaved progress.",
        });
      }
    } catch (e) {
      console.error("Failed to load draft", e);
    }
  }, [draftKey, toast]);

  useEffect(() => {
    if (!activityName && !memorableMoment && !challengesLearned && !beneficiaryQuote) return;
    
    const draft = {
      activityName, ecosystemPhase, transportCost, staffTimeCost, materialsCost,
      selectedMultipliers, actualCost, goalQuantity, keyResultId, parentsAttended,
      teachersAttended, treesPlanted, memorableMoment, challengesLearned, beneficiaryQuote,
      district, subcounty, parish
    };
    
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [
      activityName, ecosystemPhase, transportCost, staffTimeCost, materialsCost,
      selectedMultipliers, actualCost, goalQuantity, keyResultId, parentsAttended,
      teachersAttended, treesPlanted, memorableMoment, challengesLearned, beneficiaryQuote,
      district, subcounty, parish,
      draftKey
  ]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
  };

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
      district: district,
      subcounty: subcounty,
      parish: parish,
    };

    if (showParentsAttended) activityData.parents_attended = parentsAttended;
    if (showTeachersAttended) activityData.teachers_attended = teachersAttended;
    if (showTreesPlanted) activityData.trees_planted = treesPlanted;

    const activitiesCollection = collection(firestore, 'activities');
    
    try {
        await addDocumentNonBlocking(activitiesCollection, activityData);
        clearDraft();
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
                  <CardDescription>The program associated with this form could not be found.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button asChild variant="outline"><Link href="/meal"><ArrowLeft className="mr-2 h-4 w-4" />Back to MEAL Hub</Link></Button>
              </CardContent>
          </Card>
      )
  }
  
  return (
      <Card className="border-lg shadow-comic-sm w-full overflow-hidden">
           <CardHeader className="p-4 sm:p-6 lg:p-8 border-b-lg border-muted">
            <div className='flex items-center gap-3 sm:gap-4'>
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                <div className="min-w-0">
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl truncate">{programTitle} Activity Report</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">{formDescription}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0 mb-4">
                    <TabsList className="w-full min-w-max sm:w-auto sm:min-w-0">
                        <TabsTrigger value="planning" className="text-xs sm:text-sm">1. Planning</TabsTrigger>
                        <TabsTrigger value="execution" className="text-xs sm:text-sm">2. Execution</TabsTrigger>
                        <TabsTrigger value="logging" className="text-xs sm:text-sm">3. Logging</TabsTrigger>
                    </TabsList>
                </div>
                
                <TabsContent value="planning" className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="activityName">Activity Name</Label>
                        <Input
                          id="activityName"
                          placeholder="e.g., Tree Planting @ Greenhill"
                          value={activityName}
                          onChange={(e) => setActivityName(e.target.value)}
                          className="h-10 sm:h-11"
                        />
                    </div>
                   
                    <div className="space-y-2">
                        <Label htmlFor="ecosystemPhase">Ecosystem Phase</Label>
                        <Select onValueChange={(value: "Identify & Inspire" | "Equip & Empower" | "Activate & Sustain") => setEcosystemPhase(value)} value={ecosystemPhase}>
                            <SelectTrigger id="ecosystemPhase" className="h-10 sm:h-11"><SelectValue placeholder="Select phase..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Identify & Inspire">Identify & Inspire</SelectItem>
                                <SelectItem value="Equip & Empower">Equip & Empower</SelectItem>
                                <SelectItem value="Activate & Sustain">Activate & Sustain</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 pt-2 border-t">
                        <Label className="text-sm font-medium text-primary">Activity Location</Label>
                        <LocationPicker
                          districtValue={district}
                          subcountyValue={subcounty}
                          parishValue={parish}
                          onDistrictChange={setDistrict}
                          onSubcountyChange={setSubcounty}
                          onParishChange={setParish}
                        />
                    </div>

                    <Separator />
                    
                    <div className="space-y-2">
                        <h3 className="font-medium text-sm sm:text-base">Primary Goal</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="sm:col-span-2 space-y-2">
                              <Label className="text-xs sm:text-sm">Program</Label>
                              <Input value={program.title} disabled className="h-10 sm:h-11" />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="program-quantity" className="text-xs sm:text-sm">Objectives</Label>
                              <Input id="program-quantity" type="number" placeholder="e.g., 1" value={goalQuantity} onChange={e => setGoalQuantity(Number(e.target.value))} className="h-10 sm:h-11" />
                          </div>
                       </div>
                    </div>
                    
                    {showParentsAttended && (
                        <div className="space-y-2">
                            <Label htmlFor="parents-attended" className="text-xs sm:text-sm">Parents Attended</Label>
                            <Input id="parents-attended" type="number" placeholder="e.g., 25" value={parentsAttended} onChange={e => setParentsAttended(Number(e.target.value))} className="h-10 sm:h-11" />
                        </div>
                    )}
                    {showTeachersAttended && (
                        <div className="space-y-2">
                            <Label htmlFor="teachers-attended" className="text-xs sm:text-sm">Teachers Attended</Label>
                            <Input id="teachers-attended" type="number" placeholder="e.g., 5" value={teachersAttended} onChange={e => setTeachersAttended(Number(e.target.value))} className="h-10 sm:h-11" />
                        </div>
                    )}
                    {showTreesPlanted && (
                        <div className="space-y-2">
                            <Label htmlFor="trees-planted" className="text-xs sm:text-sm">Trees Planted</Label>
                            <Input id="trees-planted" type="number" placeholder="e.g., 150" value={treesPlanted} onChange={e => setTreesPlanted(Number(e.target.value))} className="h-10 sm:h-11" />
                        </div>
                    )}
                   
                    <div className="p-3 sm:p-4 bg-muted rounded-lg sm:rounded-xl">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Direct Value:</span>
                            <span className="font-bold">{formatCurrency(directValue)}</span>
                        </div>
                    </div>

                    <Button type="button" onClick={() => setCurrentTab("execution")} className="w-full h-10 sm:h-11">Next: Plan Execution</Button>
                </TabsContent>
                
                <TabsContent value="execution" className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm sm:text-base">Estimated Costs</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="transportCost" className="text-xs sm:text-sm">Transport</Label>
                                <Input id="transportCost" type="number" step="1000" value={transportCost} onChange={e => setTransportCost(Number(e.target.value))} className="h-10 sm:h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="staffTimeCost" className="text-xs sm:text-sm">Staff Time</Label>
                                <Input id="staffTimeCost" type="number" step="1000" value={staffTimeCost} onChange={e => setStaffTimeCost(Number(e.target.value))} className="h-10 sm:h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="materialsCost" className="text-xs sm:text-sm">Materials</Label>
                                <Input id="materialsCost" type="number" step="1000" value={materialsCost} onChange={e => setMaterialsCost(Number(e.target.value))} className="h-10 sm:h-11" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-right font-bold p-3 sm:p-4 bg-muted rounded-lg sm:rounded-xl text-sm sm:text-base">
                        Total: {formatCurrency(preActivityCost)}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm sm:text-base">Value Multipliers</h3>
                        <div className="space-y-2">
                            {multipliers.map((m) => (
                                <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg sm:rounded-xl hover:bg-muted/50">
                                <Checkbox id={m.id} onCheckedChange={(checked) => handleMultiplierChange(m.id, !!checked)} checked={selectedMultipliers.includes(m.id)} />
                                <Label htmlFor={m.id} className="flex-1 cursor-pointer text-sm">{m.label}</Label>
                                <span className="text-muted-foreground text-xs sm:text-sm font-medium">{formatCurrency(m.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-3 sm:p-4 bg-muted rounded-lg sm:rounded-xl">
                        <div className="flex justify-between items-center text-sm sm:text-base">
                            <span className="text-muted-foreground">Indirect Value:</span>
                            <span className="font-bold">{formatCurrency(indirectValue)}</span>
                        </div>
                    </div>
                    
                    <Button type="button" onClick={() => setCurrentTab("logging")} className="w-full h-10 sm:h-11">Next: Log Results</Button>
                </TabsContent>
                
                <TabsContent value="logging" className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                    <div className="p-4 sm:p-6 bg-amber-50 rounded-lg sm:rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-sm sm:text-base">
                          <span className="text-muted-foreground">Total Value:</span>
                          <span className="font-bold">{formatCurrency(totalValue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg sm:text-xl">
                          <span className="font-heading">Est. ROI:</span>
                          <span className={`font-bold ${estimatedRoi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{estimatedRoi.toFixed(0)}%</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="key-result" className="text-xs sm:text-sm">Link to Key Result</Label>
                        {isLoadingKeyResults ? <Skeleton className="h-10 sm:h-11 w-full" /> : (
                            <Select onValueChange={setKeyResultId} value={keyResultId || undefined}>
                                <SelectTrigger id="key-result" className="h-10 sm:h-11">
                                    <SelectValue placeholder="Select a Key Result..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {keyResults?.map(kr => (
                                        <SelectItem key={kr.id} value={kr.id} className="text-sm">{kr.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                   
                    <div className="space-y-2">
                        <Label htmlFor="actualCost" className="text-xs sm:text-sm">Actual Final Cost</Label>
                        <Input id="actualCost" type="number" value={actualCost} onChange={e => setActualCost(Number(e.target.value))} className="h-10 sm:h-11" />
                    </div>

                    <Separator />
                   
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm sm:text-base">Post-Activity Story</h3>
                        <div className="space-y-2">
                            <Label htmlFor="memorableMoment" className="text-xs sm:text-sm">Memorable Moment</Label>
                            <Textarea id="memorableMoment" placeholder="Describe a specific moment..." value={memorableMoment} onChange={e => setMemorableMoment(e.target.value)} className="min-h-[80px] sm:min-h-[100px]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="challengesLearned" className="text-xs sm:text-sm">Challenges & Learnings</Label>
                            <Textarea id="challengesLearned" placeholder="What challenges did you face?" value={challengesLearned} onChange={e => setChallengesLearned(e.target.value)} className="min-h-[80px] sm:min-h-[100px]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="beneficiaryQuote" className="text-xs sm:text-sm">Beneficiary Quote</Label>
                            <Textarea id="beneficiaryQuote" placeholder='e.g., "I never knew..."' value={beneficiaryQuote} onChange={e => setBeneficiaryQuote(e.target.value)} className="min-h-[80px] sm:min-h-[100px]" />
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 bg-green-50 rounded-lg sm:rounded-xl">
                        <div className="flex justify-between items-center text-lg sm:text-xl">
                            <span className="font-heading">Final ROI:</span>
                            <span className={`font-bold ${finalRoi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{finalRoi.toFixed(0)}%</span>
                        </div>
                    </div>
                    
                    <Button type="button" className="w-full h-10 sm:h-12" size="lg" onClick={handleLogActivity} disabled={loading || !activityName.trim()}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Log Activity
                    </Button>
                </TabsContent>
            </Tabs>
          </CardContent>
      </Card>
  );
}
