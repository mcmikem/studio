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

export function ActivityReportForm({ isPage = false }: { isPage?: boolean }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [activityName, setActivityName] = useState('');
  const [transportCost, setTransportCost] = useState(15000);
  const [staffTimeCost, setStaffTimeCost] = useState(20000);
  const [materialsCost, setMaterialsCost] = useState(10000);
  const [selectedMultipliers, setSelectedMultipliers] = useState<string[]>([]);
  const [actualCost, setActualCost] = useState(45000);
  
  const [goalType, setGoalType] = useState<'Metric' | 'Program'>('Metric');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalQuantity, setGoalQuantity] = useState(0);

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
    setIsClient(true);
  }, []);
  
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
    if (!activityName.trim() || !user || !firestore || !selectedGoalId) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide an activity name, select a primary goal, and be logged in to save.',
      });
      return;
    }
    setLoading(true);

    const activityData = {
      title: activityName,
      userId: user.uid,
      userName: user.displayName || user.email,
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

    const activitiesCollection = collection(firestore, 'activities');
    addDocumentNonBlocking(activitiesCollection, activityData);

    toast({
      title: 'Activity Logged!',
      description: `${activityName} has been saved.`,
    });

    // Reset some fields after logging
    setActivityName('');
    setSelectedMultipliers([]);
    setSelectedGoalId(null);
    setGoalQuantity(0);
    setLoading(false);
  };

  if (!isClient) {
    return null;
  }
  
  const renderGoalSelectors = () => {
    const isLoading = isLoadingMetrics || isLoadingPrograms;
    if (goalType === 'Metric') {
        return (
            <div className="grid grid-cols-3 gap-4 items-end">
                <div className="col-span-2 space-y-2">
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
             <div className="grid grid-cols-3 gap-4 items-end">
                <div className="col-span-2 space-y-2">
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
  
  const CalculatorForm = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>1. Pre-Activity ROI Assessment</CardTitle>
            <CardDescription>
              Plan your activity to maximize its impact before you even go.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="activityName">Activity Name</Label>
              <Input
                id="activityName"
                placeholder="e.g., Tree Planting @ Greenhill"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
              />
            </div>

            <Separator />
             <h3 className="font-semibold text-lg">Primary Goal</h3>
             <div className='space-y-2'>
                <Label htmlFor="goal-type">Goal Type</Label>
                 <Select onValueChange={(value: 'Metric' | 'Program') => setGoalType(value)} value={goalType}>
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

             <p className="text-sm text-muted-foreground">The "Direct Value" of your activity is now automatically calculated based on the selected goal's value.</p>


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
                  <Label
                    htmlFor={m.id}
                    className="flex-1 cursor-pointer"
                  >
                    {m.label}{' '}
                    <span className="text-muted-foreground text-xs">
                      ({formatCurrency(m.value)})
                    </span>
                  </Label>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4 pt-2">
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
                <span className="font-bold">
                  {formatCurrency(indirectValue)}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">
                  Total Estimated Value:
                </span>
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
          </CardContent>
        </Card>

        <Card className={isPage ? "sticky top-6" : ""}>
          <CardHeader>
            <CardTitle>2. Post-Activity ROI Calculation</CardTitle>
            <CardDescription>
              Enter the final numbers to see your real impact.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">
                  Total Value Created:
                </span>
                <span className="font-bold">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Actual Cost:</span>
                <span className="font-bold">{formatCurrency(actualCost)}</span>
              </div>
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
              onClick={handleLogActivity}
              disabled={loading || !activityName.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log this Activity & ROI
            </Button>
          </CardContent>
        </Card>
      </div>
  );

  return CalculatorForm;
}

    