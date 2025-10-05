'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState, useMemo, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(value);
};

const multipliers = [
    { id: 'combine', label: 'Combining with another activity', value: 15000 },
    { id: 'train', label: 'Training volunteer to lead next time', value: 25000 },
    { id: 'content', label: 'Capturing content for fundraising', value: 50000 },
    { id: 'process', label: 'Testing new process for replication', value: 30000 },
];

export default function ROICalculatorPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [activityName, setActivityName] = useState('');
  const [transportCost, setTransportCost] = useState(15000);
  const [staffTimeCost, setStaffTimeCost] = useState(20000);
  const [materialsCost, setMaterialsCost] = useState(10000);
  const [selectedMultipliers, setSelectedMultipliers] = useState<string[]>([]);
  
  const [actualCost, setActualCost] = useState(45000);
  const [directValue, setDirectValue] = useState(20000);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const preActivityCost = useMemo(() => transportCost + staffTimeCost + materialsCost, [transportCost, staffTimeCost, materialsCost]);

  const indirectValue = useMemo(() => {
    return multipliers.reduce((total, m) => selectedMultipliers.includes(m.id) ? total + m.value : total, 0);
  }, [selectedMultipliers]);

  const totalValue = useMemo(() => directValue + indirectValue, [directValue, indirectValue]);
  
  const estimatedRoi = useMemo(() => {
    if (preActivityCost === 0) return 0;
    return ((totalValue - preActivityCost) / preActivityCost) * 100;
  }, [totalValue, preActivityCost]);

  const finalRoi = useMemo(() => {
    if (actualCost === 0) return 0;
    return ((totalValue - actualCost) / actualCost) * 100;
  }, [totalValue, actualCost]);

  const handleMultiplierChange = (id: string, checked: boolean) => {
    setSelectedMultipliers(prev => checked ? [...prev, id] : prev.filter(mId => mId !== id));
  };
  
  const handleLogActivity = async () => {
    if (!activityName.trim() || !user || !firestore) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please enter an activity name before logging."
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
    };

    const activitiesCollection = collection(firestore, 'activities');
    addDocumentNonBlocking(activitiesCollection, activityData);

    toast({
        title: "Activity Logged!",
        description: `${activityName} has been saved.`
    });

    setActivityName('');
    setLoading(false);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Field Activity ROI Calculator</h1>
        <p className="text-muted-foreground">Ensure every trip pays multiple dividends.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>1. Pre-Activity ROI Assessment</CardTitle>
            <CardDescription>Plan your activity to maximize its impact before you even go.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="activityName">Activity Name</Label>
              <Input id="activityName" placeholder="e.g., Tree Planting @ Greenhill" value={activityName} onChange={e => setActivityName(e.target.value)} />
            </div>
            
            <Separator />

            <h3 className="font-semibold text-lg">Estimated Costs</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Transport: {formatCurrency(transportCost)}</Label>
                <Slider defaultValue={[15000]} min={0} max={50000} step={1000} onValueChange={(value) => setTransportCost(value[0])} />
              </div>
              <div className="space-y-2">
                <Label>Staff Time: {formatCurrency(staffTimeCost)}</Label>
                <Slider defaultValue={[20000]} min={0} max={100000} step={1000} onValueChange={(value) => setStaffTimeCost(value[0])} />
              </div>
              <div className="space-y-2">
                <Label>Materials: {formatCurrency(materialsCost)}</Label>
                <Slider defaultValue={[10000]} min={0} max={50000} step={1000} onValueganoChange={(value) => setMaterialsCost(value[0])} />
              </div>
            </div>
            <div className="text-right font-bold text-lg p-2 bg-muted rounded-md">
              Total Estimated Cost: {formatCurrency(preActivityCost)}
            </div>
            
            <Separator />
            
            <h3 className="font-semibold text-lg">Value Multipliers</h3>
            <CardDescription>Select actions you'll take to add value beyond the primary goal.</CardDescription>
            <div className="space-y-3 pt-2">
              {multipliers.map(m => (
                <div key={m.id} className="flex items-center space-x-3">
                  <Checkbox id={m.id} onCheckedChange={(checked) => handleMultiplierChange(m.id, !!checked)} />
                  <Label htmlFor={m.id} className="flex-1 cursor-pointer">{m.label} <span className="text-muted-foreground text-xs">({formatCurrency(m.value)})</span></Label>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-md">
                    <span className="text-muted-foreground">Direct Value (Primary Goal):</span>
                    <span className="font-bold">{formatCurrency(directValue)}</span>
                </div>
                <div className="flex justify-between items-center text-md">
                    <span className="text-muted-foreground">Indirect Value (Multipliers):</span>
                    <span className="font-bold">{formatCurrency(indirectValue)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Total Estimated Value:</span>
                    <span className="font-bold">{formatCurrency(totalValue)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl">
                    <span className="font-headline">Estimated ROI:</span>
                    <span className={`font-bold font-headline ${estimatedRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {estimatedRoi.toFixed(0)}%
                    </span>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>2. Post-Activity ROI Calculation</CardTitle>
            <CardDescription>Enter the final numbers to see your real impact.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="actualCost">Actual Final Cost</Label>
              <Input id="actualCost" type="number" value={actualCost} onChange={e => setActualCost(Number(e.target.value))} placeholder="e.g., 42000" />
            </div>
            
            <Separator />
            
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Total Value Created:</span>
                <span className="font-bold">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Actual Cost:</span>
                <span className="font-bold">{formatCurrency(actualCost)}</span>
              </div>
              <div className="flex justify-between items-center text-2xl pt-4">
                <span className="font-headline">Final ROI:</span>
                <span className={`font-bold font-headline ${finalRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {finalRoi.toFixed(0)}%
                </span>
              </div>
            </div>
            <Button className="w-full" onClick={handleLogActivity} disabled={loading || !activityName.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log this Activity & ROI
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
