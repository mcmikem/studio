

'use client';

import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ImpactMetric, Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(value);
};

const multipliers = [
  { id: 'combine', label: 'Combining with another activity', value: 15000 },
  { id: 'train', label: 'Training volunteer to lead next time', value: 25000 },
  { id: 'content', label: 'Capturing content for fundraising', value: 50000 },
  { id: 'process', label: 'Testing new process for replication', value: 30000 },
];

export function ActivityReportForm() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [activityName, setActivityName] = useState('');
  const [ecosystemPhase, setEcosystemPhase] = useState<"Identify & Inspire" | "Equip & Empower" | "Activate & Sustain">('Identify & Inspire');
  const [transportCost, setTransportCost] = useState(15000);
  const [staffTimeCost, setStaffTimeCost] = useState(20000);
  const [materialsCost, setMaterialsCost] = useState(10000);
  const [selectedMultipliers, setSelectedMultipliers] = useState<string[]>([]);
  const [actualCost, setActualCost] = useState(45000);
  
  const [goalType, setGoalType] = useState<'Metric' | 'Program'>('Metric');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalQuantity, setGoalQuantity] = useState(0);

  const [parentsAttended, setParentsAttended] = useState(0);
  const [teachersAttended, setTeachersAttended] = useState(0);
  const [treesPlanted, setTreesPlanted] = useState(0);

  const metricsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'impact-metrics'), orderBy('metric'));
  }, [firestore]);
  const { data: metrics, isLoading: isLoadingMetrics } = useCollection<ImpactMetric>(metricsQuery);

  const programsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'), orderBy('title'));
  }, [firestore]);
  const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);

  const selectedMetric = useMemo(() => {
    if (goalType !== 'Metric') return null;
    return metrics?.find(m => m.id === selectedGoalId) || null;
  }, [metrics, selectedGoalId, goalType]);

  const selectedProgram = useMemo(() => {
    if (goalType !== 'Program') return null;
    return programs?.find(p => p.id === selectedGoalId) || null;
  }, [programs, selectedGoalId, goalType]);
  
  useEffect(() => {
    setSelectedGoalId(null);
    setGoalQuantity(0);
  }, [goalType]);

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
    if (goalType === 'Metric' && selectedMetric?.valuePerUnit) {
      return goalQuantity * selectedMetric.valuePerUnit;
    }
    if (goalType === 'Program' && selectedProgram?.valuePerObjective) {
      return goalQuantity * selectedProgram.valuePerObjective;
    }
    return 0;
  }, [goalType, selectedMetric, selectedProgram, goalQuantity]);


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
    if (!activityName.trim() || !user || !firestore || !selectedGoalId || !profile) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide an activity name, select a primary goal, and be logged in to save.',
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
      primaryGoalType: goalType,
      primaryGoalId: selectedGoalId,
      primaryGoalQuantity: goalQuantity,
    };

    if (selectedProgram?.title === 'RED Campaign') {
        activityData.parents_attended = parentsAttended;
        activityData.teachers_attended = teachersAttended;
    }
    if (selectedProgram?.title === 'GreenSchools Campaign') {
        activityData.trees_planted = treesPlanted;
    }

    const activitiesCollection = collection(firestore, 'activities');
    
    try {
        await addDocumentNonBlocking(activitiesCollection, activityData);
        toast({
          title: 'Activity Logged!',
          description: `${activityName} has been saved.`,
        });

        // Reset some fields after logging
        setActivityName('');
        setSelectedMultipliers([]);
        setSelectedGoalId(null);
        setGoalQuantity(0);
        setParentsAttended(0);
        setTeachersAttended(0);
        setTreesPlanted(0);
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
  
  const renderGoalSelectors = () => {
    const isLoading = isLoadingMetrics || isLoadingPrograms;
    if (goalType === 'Metric') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="primary-metric">Primary Metric</Label>
                    {isLoading ? <Skeleton className="h-10 w-full" /> : (
                        <Select onValueChange={setSelectedGoalId} value={selectedGoalId || undefined}>
                            <SelectTrigger id="primary-metric">
                                <SelectValue placeholder="Select a metric..." />
                            </SelectTrigger>
                            <SelectContent>
                                {metrics?.map(metric => (
                                    <SelectItem key={metric.id} value={metric.id}>{metric.metric}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="metric-quantity">Quantity ({selectedMetric?.unit || 'units'})</Label>
                    <Input id="metric-quantity" type="number" placeholder="e.g., 50" value={goalQuantity} onChange={e => setGoalQuantity(Number(e.target.value))} disabled={!selectedGoalId} />
                </div>
             </div>
        )
    }
     if (goalType === 'Program') {
        return (
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="primary-program">Program</Label>
                    {isLoading ? <Skeleton className="h-10 w-full" /> : (
                        <Select onValueChange={setSelectedGoalId} value={selectedGoalId || undefined}>
                            <SelectTrigger id="primary-program">
                                <SelectValue placeholder="Select a program..." />
                            </SelectTrigger>
                            <SelectContent>
                                {programs?.map(program => (
                                    <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="program-quantity">Objectives</Label>
                    <Input id="program-quantity" type="number" placeholder="e.g., 1" value={goalQuantity} onChange={e => setGoalQuantity(Number(e.target.value))} disabled={!selectedGoalId} />
                </div>
             </div>
        )
    }
    return null;
  }

  const preActivityContent = (
    <div className="space-y-6">
      <CardHeader className="px-0">
        <CardTitle>1. Pre-Activity ROI Assessment</CardTitle>
        <CardDescription>
          Plan your activity to maximize its impact before you even go.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-0">
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
                <SelectTrigger id="ecosystemPhase">
                    <SelectValue placeholder="Select phase..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Identify & Inspire">Identify & Inspire</SelectItem>
                    <SelectItem value="Equip & Empower">Equip & Empower</SelectItem>
                    <SelectItem value="Activate & Sustain">Activate & Sustain</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <Separator />
        <h3 className="font-semibold text-lg">Primary Goal</h3>
        <div className="space-y-2">
          <Label htmlFor="goal-type">Goal Type</Label>
          <Select
            onValueChange={(value: 'Metric' | 'Program') => setGoalType(value)}
            value={goalType}
          >
            <SelectTrigger id="goal-type">
              <SelectValue placeholder="Select goal type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Metric">KPI Metric</SelectItem>
              <SelectItem value="Program">Program Objective</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {renderGoalSelectors()}

        {selectedProgram?.title === 'RED Campaign' && (
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 border rounded-md">
                 <div className="space-y-2">
                    <Label htmlFor="parents-attended">Parents Attended</Label>
                    <Input id="parents-attended" type="number" placeholder="e.g., 25" value={parentsAttended} onChange={e => setParentsAttended(Number(e.target.value))} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="teachers-attended">Teachers Attended</Label>
                    <Input id="teachers-attended" type="number" placeholder="e.g., 5" value={teachersAttended} onChange={e => setTeachersAttended(Number(e.target.value))} />
                </div>
            </div>
        )}
        
        {selectedProgram?.title === 'GreenSchools Campaign' && (
            <div className="mt-4 p-4 border rounded-md">
                 <div className="space-y-2">
                    <Label htmlFor="trees-planted">Trees Planted</Label>
                    <Input id="trees-planted" type="number" placeholder="e.g., 150" value={treesPlanted} onChange={e => setTreesPlanted(Number(e.target.value))} />
                </div>
            </div>
        )}

        <p className="text-sm text-muted-foreground">
          The "Direct Value" of your activity is now automatically calculated
          based on the selected goal's value.
        </p>

        <h3 className="font-semibold text-lg">Estimated Costs</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transportCost">Transport Cost</Label>
            <Input
              id="transportCost"
              type="number"
              step="1000"
              value={transportCost}
              onChange={(e) => setTransportCost(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staffTimeCost">Staff Time Cost</Label>
            <Input
              id="staffTimeCost"
              type="number"
              step="1000"
              value={staffTimeCost}
              onChange={(e) => setStaffTimeCost(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="materialsCost">Materials Cost</Label>
            <Input
              id="materialsCost"
              type="number"
              step="1000"
              value={materialsCost}
              onChange={(e) => setMaterialsCost(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="text-right font-bold text-lg p-2 bg-muted rounded-md">
          Total Estimated Cost: {formatCurrency(preActivityCost)}
        </div>

        <Separator />

        <h3 className="font-semibold text-lg">Value Multipliers</h3>
        <CardDescription>
          Select actions you'll take to add value beyond the primary goal.
        </CardDescription>
        <div className="space-y-3 pt-2">
          {multipliers.map((m) => (
            <div key={m.id} className="flex items-center space-x-3">
              <Checkbox
                id={m.id}
                onCheckedChange={(checked) =>
                  handleMultiplierChange(m.id, !!checked)
                }
                checked={selectedMultipliers.includes(m.id)}
              />
              <Label htmlFor={m.id} className="flex-1 cursor-pointer">
                {m.label}{' '}
                <span className="text-muted-foreground text-xs">
                  ({formatCurrency(m.value)})
                </span>
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </div>
  );

  const postActivityContent = (
    <div className="space-y-6">
       <CardHeader className="px-0">
        <CardTitle>2. ROI Calculation & Logging</CardTitle>
        <CardDescription>
          Enter the final numbers and save your report.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-0">
        <div className="space-y-4 pt-2 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg">
          <div className="flex justify-between items-center text-md">
            <span className="text-muted-foreground">
              Direct Value (Primary Goal):
            </span>
            <span className="font-bold">{formatCurrency(directValue)}</span>
          </div>
          <div className="flex justify-between items-center text-md">
            <span className="text-muted-foreground">
              Indirect Value (Multipliers):
            </span>
            <span className="font-bold">{formatCurrency(indirectValue)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg">
            <span className="text-muted-foreground">Total Estimated Value:</span>
            <span className="font-bold">{formatCurrency(totalValue)}</span>
          </div>
          <div className="flex justify-between items-center text-2xl">
            <span className="font-headline">Estimated ROI:</span>
            <span
              className={`font-bold font-headline ${
                estimatedRoi >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {estimatedRoi.toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="actualCost">Actual Final Cost</Label>
          <Input
            id="actualCost"
            type="number"
            value={actualCost}
            onChange={(e) => setActualCost(Number(e.target.value))}
            placeholder="e.g., 42000"
          />
        </div>

        <Separator />

        <div className="space-y-4 pt-2 bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
           <div className="flex justify-between items-center text-2xl pt-4">
            <span className="font-headline">Final ROI:</span>
            <span
              className={`font-bold font-headline ${
                finalRoi >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {finalRoi.toFixed(0)}%
            </span>
          </div>
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={handleLogActivity}
          disabled={loading || !activityName.trim()}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log this Activity & ROI
        </Button>
      </CardContent>
    </div>
  )
  
  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:grid md:grid-cols-2 gap-8 items-start">
        {preActivityContent}
        <div className="sticky top-6">
          {postActivityContent}
        </div>
      </div>
       {/* Mobile View */}
       <div className="md:hidden">
          <Tabs defaultValue="planning">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="planning">1. Planning</TabsTrigger>
                  <TabsTrigger value="logging">2. Logging</TabsTrigger>
              </TabsList>
              <TabsContent value="planning" className="pt-4">
                  {preActivityContent}
              </TabsContent>
              <TabsContent value="logging" className="pt-4">
                  {postActivityContent}
              </TabsContent>
          </Tabs>
       </div>
    </>
  );
}

    

    
