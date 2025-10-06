'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  doc,
} from 'firebase/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { PlusCircle, Target, Edit, Trash2 } from 'lucide-react';
import type { ImpactMetric } from '@/lib/types';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';

const metricSchema = z.object({
  metric: z.string().min(3, 'Metric name is required.'),
  current: z.coerce.number().min(0, 'Current value cannot be negative.'),
  target: z.coerce.number().min(1, 'Target must be greater than zero.'),
  unit: z.string().optional(),
  valuePerUnit: z.coerce.number().min(0, 'Value per unit cannot be negative.').optional(),
});

type MetricFormData = z.infer<typeof metricSchema>;


function MetricForm({ 
    metric,
    onFormSubmit 
}: { 
    metric?: ImpactMetric;
    onFormSubmit: () => void 
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MetricFormData>({
    resolver: zodResolver(metricSchema),
    defaultValues: metric || {
        current: 0,
        target: 100,
        valuePerUnit: 0,
    }
  });

  const onSubmit = async (data: z.infer<typeof metricSchema>) => {
    if (!firestore) return;

    if (metric) {
        const metricRef = doc(firestore, 'impact-metrics', metric.id);
        updateDocumentNonBlocking(metricRef, data);
        toast({
            title: 'Metric Updated!',
            description: `${data.metric} has been successfully updated.`,
        });
    } else {
        const metricsCollection = collection(firestore, 'impact-metrics');
        addDocumentNonBlocking(metricsCollection, data);
        toast({
          title: 'Metric Added!',
          description: `${data.metric} has been added to your dashboard.`,
        });
    }
    
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {isSubmitting ? (metric ? 'Saving...' : 'Adding...') : (metric ? 'Save Changes' : 'Add Metric')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function MetricsPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<ImpactMetric | null>(null);

  const firestore = useFirestore();
  const metricsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'impact-metrics'), orderBy('metric'));
  }, [firestore]);

  const { data: metrics, isLoading } = useCollection<ImpactMetric>(metricsQuery);

  const handleDelete = (metricId: string) => {
    if (!firestore) return;
    const metricRef = doc(firestore, 'impact-metrics', metricId);
    deleteDocumentNonBlocking(metricRef);
    toast({
        title: "Metric Deleted",
        description: "The metric has been removed from your dashboard.",
    });
  };

  const { toast } = useToast();

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle>Impact Metrics (KPIs)</CardTitle>
          <CardDescription>
            Manage the Key Performance Indicators for the organization.
          </CardDescription>
        </div>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
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
            <MetricForm onFormSubmit={() => setIsNewDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Mobile View */}
        <div className="space-y-4 sm:hidden">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
          {metrics && metrics.length > 0 ? (
            metrics.map((metric) => {
                const progress = (metric.current / metric.target) * 100;
                return (
                  <Card key={metric.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{metric.metric}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       <div className="flex justify-between items-baseline">
                         <span className="text-2xl font-bold">{metric.current.toLocaleString()}</span>
                         <span className="text-sm text-muted-foreground">/ {metric.target.toLocaleString()} {metric.unit}</span>
                       </div>
                       <div>
                         <Progress value={progress} className="h-2 w-full" />
                         <p className="text-xs text-muted-foreground mt-1 text-right">{progress.toFixed(0)}% to target</p>
                       </div>
                       <p className="text-sm text-muted-foreground"><strong>Value/Unit:</strong> {(metric.valuePerUnit || 0).toLocaleString()} UGX</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingMetric(metric)}>
                          <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the metric "{metric.metric}".
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(metric.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                )
            })
          ) : (
            !isLoading && (
              <div className="h-48 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Target className="h-12 w-12" />
                <span className="text-lg font-semibold mt-2">No Metrics Found</span>
                <p className="text-sm">Add a metric to get started.</p>
              </div>
            )
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Metric</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Value/Unit</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingMetric(metric)}>
                              <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the metric "{metric.metric}".
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(metric.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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
        </div>
      </CardContent>
      {editingMetric && (
         <Dialog open={!!editingMetric} onOpenChange={(open) => !open && setEditingMetric(null)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Impact Metric</DialogTitle>
                    <DialogDescription>Update the details for "{editingMetric.metric}".</DialogDescription>
                </DialogHeader>
                <MetricForm metric={editingMetric} onFormSubmit={() => setEditingMetric(null)} />
            </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
