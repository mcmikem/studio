'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Target } from 'lucide-react';
import type { ImpactMetric } from '@/lib/types';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const metricSchema = z.object({
  metric: z.string().min(3, 'Metric name is required.'),
  current: z.coerce.number().min(0, 'Current value cannot be negative.'),
  target: z.coerce.number().min(1, 'Target must be greater than zero.'),
  unit: z.string().optional(),
  valuePerUnit: z.coerce.number().min(0, 'Value per unit cannot be negative.').optional(),
});

function NewMetricForm({ onFormSubmit }: { onFormSubmit: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(metricSchema),
    defaultValues: {
        current: 0,
        target: 100,
        valuePerUnit: 0,
    }
  });

  const onSubmit = async (data: z.infer<typeof metricSchema>) => {
    if (!firestore) return;
    const metricsCollection = collection(firestore, 'impact-metrics');
    addDocumentNonBlocking(metricsCollection, data);
    toast({
      title: 'Metric Added!',
      description: `${data.metric} has been added to your dashboard.`,
    });
    reset();
    onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="metric">Metric Name</Label>
        <Input id="metric" {...register('metric')} placeholder="e.g., Youth Reached" />
        {errors.metric && (
          <p className="text-sm text-destructive">{`${errors.metric.message}`}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="current">Current Value</Label>
          <Input id="current" type="number" {...register('current')} />
          {errors.current && <p className="text-sm text-destructive">{`${errors.current.message}`}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="target">Target Value</Label>
          <Input id="target" type="number" {...register('target')} />
           {errors.target && <p className="text-sm text-destructive">{`${errors.target.message}`}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" {...register('unit')} placeholder="e.g., students, trees" />
            {errors.unit && <p className="text-sm text-destructive">{`${errors.unit.message}`}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="valuePerUnit">Value per Unit (UGX)</Label>
            <Input id="valuePerUnit" type="number" {...register('valuePerUnit')} placeholder="e.g., 1000" />
            {errors.valuePerUnit && <p className="text-sm text-destructive">{`${errors.valuePerUnit.message}`}</p>}
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Metric'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function MetricsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const metricsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'impact-metrics'), orderBy('metric'));
  }, [firestore]);

  const { data: metrics, isLoading } = useCollection<ImpactMetric>(metricsQuery);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Impact Metrics (KPIs)</CardTitle>
          <CardDescription>
            Manage the Key Performance Indicators for the organization.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Metric
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Impact Metric</DialogTitle>
              <DialogDescription>
                Define a new KPI to track on the main dashboard.
              </DialogDescription>
            </DialogHeader>
            <NewMetricForm onFormSubmit={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Metric</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Value/Unit</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                </TableRow>
              ))}
            {metrics && metrics.length > 0 ? (
              metrics.map((metric) => {
                const progress = (metric.current / metric.target) * 100;
                return (
                  <TableRow key={metric.id}>
                    <TableCell className="font-medium">{metric.metric}</TableCell>
                    <TableCell>{metric.current.toLocaleString()} {metric.unit}</TableCell>
                    <TableCell>{metric.target.toLocaleString()} {metric.unit}</TableCell>
                     <TableCell>{(metric.valuePerUnit || 0).toLocaleString()} UGX</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Target className="h-12 w-12" />
                      <span className="text-lg font-semibold">
                        No Metrics Found
                      </span>
                      <p className="text-sm">Add a metric to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
