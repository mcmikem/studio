'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState, useMemo, useEffect } from 'react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(value);
};

export default function ROICalculatorPage() {
  const [transportCost, setTransportCost] = useState(15000);
  const [staffTimeCost, setStaffTimeCost] = useState(20000);
  const [materialsCost, setMaterialsCost] = useState(10000);

  const [actualCost, setActualCost] = useState(0);
  const [directValue, setDirectValue] = useState(15000);
  const [indirectValue, setIndirectValue] = useState({
    volunteerTrained: 10000,
    contentCaptured: 15000,
    systemEstablished: 20000,
  });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const preActivityCost = useMemo(() => transportCost + staffTimeCost + materialsCost, [transportCost, staffTimeCost, materialsCost]);
  const totalIndirectValue = useMemo(() => Object.values(indirectValue).reduce((a, b) => a + b, 0), [indirectValue]);
  const totalValue = useMemo(() => directValue + totalIndirectValue, [directValue, totalIndirectValue]);
  const roi = useMemo(() => {
    if (actualCost === 0) return 0;
    return ((totalValue - actualCost) / actualCost) * 100;
  }, [totalValue, actualCost]);
  
  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Field Activity ROI Calculator</h1>
        <p className="text-muted-foreground">Ensure every trip pays multiple dividends.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pre-Activity ROI Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="activityName">Activity Name</Label>
              <Input id="activityName" placeholder="e.g., Tree Planting @ Greenhill" />
            </div>
            
            <Separator />

            <h3 className="font-semibold text-lg">Basic Cost</h3>
            <div className="space-y-2">
              <Label>Transport: {formatCurrency(transportCost)}</Label>
              <Input type="range" min="0" max="50000" step="1000" value={transportCost} onChange={e => setTransportCost(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Staff Time: {formatCurrency(staffTimeCost)}</Label>
              <Input type="range" min="0" max="100000" step="1000" value={staffTimeCost} onChange={e => setStaffTimeCost(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Materials: {formatCurrency(materialsCost)}</Label>
              <Input type="range" min="0" max="50000" step="1000" value={materialsCost} onChange={e => setMaterialsCost(Number(e.target.value))} />
            </div>
            <div className="text-right font-bold text-lg">
              Total Estimated Cost: {formatCurrency(preActivityCost)}
            </div>
            
            <Separator />
            
            <h3 className="font-semibold text-lg">ROI Multipliers Being Activated</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2"><Checkbox id="m1" /> <Label htmlFor="m1">Combining with another activity</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="m2" /> <Label htmlFor="m2">Training volunteer to lead next time</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="m3" /> <Label htmlFor="m3">Capturing content for fundraising</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="m4" /> <Label htmlFor="m4">Testing new process for replication</Label></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Post-Activity ROI Calculation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actualCost">Actual Cost</Label>
              <Input id="actualCost" type="number" value={actualCost} onChange={e => setActualCost(Number(e.target.value))} placeholder="e.g., 42000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="directValue">Direct Value (e.g., 30 trees planted = 15K value)</Label>
              <Input id="directValue" type="number" value={directValue} onChange={e => setDirectValue(Number(e.target.value))} placeholder="e.g., 15000" />
            </div>
            
            <Separator />

            <h3 className="font-semibold text-lg">Indirect Value</h3>
            <div className="space-y-2">
              <Label htmlFor="volunteerValue">Volunteer trained</Label>
              <Input id="volunteerValue" type="number" value={indirectValue.volunteerTrained} onChange={e => setIndirectValue(v => ({...v, volunteerTrained: Number(e.target.value)}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentValue">Content captured</Label>
              <Input id="contentValue" type="number" value={indirectValue.contentCaptured} onChange={e => setIndirectValue(v => ({...v, contentCaptured: Number(e.target.value)}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemValue">System established</Label>
              <Input id="systemValue" type="number" value={indirectValue.systemEstablished} onChange={e => setIndirectValue(v => ({...v, systemEstablished: Number(e.target.value)}))} />
            </div>
            
            <Separator />
            
            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-bold">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Actual Cost:</span>
                <span className="font-bold">{formatCurrency(actualCost)}</span>
              </div>
              <div className="flex justify-between items-center text-2xl">
                <span className="font-headline">ROI:</span>
                <span className={`font-bold font-headline ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {roi.toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
