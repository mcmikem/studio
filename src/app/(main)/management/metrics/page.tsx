
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  doc,
  serverTimestamp,
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
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Target, Edit, Trash2 } from 'lucide-react';
import type { ImpactMetric } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import { EmptyState } from '@/components/ui/empty-state';


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
        const newMetric = {
            ...data,
            createdAt: serverTimestamp()
        };
        addDocumentNonBlocking(metricsCollection, newMetric);
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

function MetricCard({ metric }: { metric: ImpactMetric }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [editingMetric, setEditingMetric] = useState<ImpactMetric | null>(null);

    const handleDelete = (metricId: string) => {
        if (!firestore) return;
        const metricRef = doc(firestore, 'impact-metrics', metricId);
        deleteDocumentNonBlocking(metricRef);
        toast({
            title: "Metric Deleted",
            description: "The metric has been removed from your dashboard.",
        });
    };

    const progress = metric.target > 0 ? (metric.current / metric.target) * 100 : 0;
    const remaining = 100 - progress;
    const chartData = [
        { name: "achieved", value: progress, fill: "hsl(var(--primary))" },
        { name: "remaining", value: remaining > 0 ? remaining : 0, fill: "hsl(var(--muted))" },
    ];
    const chartConfig = {
        achieved: { label: "Achieved", color: "hsl(var(--primary))" },
        remaining: { label: "Remaining", color: "hsl(var(--muted))" },
    };
    const formatValue = (val: number) =>
        metric.unit === "UGX"
            ? new Intl.NumberFormat("en-UG", {
                style: "currency", currency: "UGX", minimumFractionDigits: 0
            }).format(val)
            : val.toLocaleString();

    return (
        <>
            <Card key={metric.id}>
                <CardHeader>
                    <CardTitle className="text-lg">{metric.metric}</CardTitle>
                    <CardDescription>{metric.unit || 'Units'}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                    <ChartContainer config={chartConfig} className="h-40 w-full">
                        <PieChart accessibilityLayer>
                            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} startAngle={90} endAngle={450}>
                                {chartData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{formatValue(metric.current)}</p>
                        <p className="text-sm text-muted-foreground">Target: {formatValue(metric.target)}</p>
                    </div>
                </CardContent>
                 <CardFooter className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setEditingMetric(metric)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
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
        </>
    )
}

export default function MetricsPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  
  const metricsQuery = useMemoFirebase((db) => {
    return query(collection(db, 'impact-metrics'), orderBy('metric'));
  }, []);

  const { data: metrics, isLoading } = useCollection<ImpactMetric>(metricsQuery);

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
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            ))}
            {metrics && metrics.length > 0 ? (
                metrics.map(metric => <MetricCard key={metric.id} metric={metric} />)
            ) : (
                !isLoading && (
                    <div className="md:col-span-2 lg:col-span-3">
                        <EmptyState 
                            icon={Target}
                            title="No Metrics Found"
                            description="Add a new metric using the button above to start tracking your impact."
                        />
                    </div>
                )
            )}
        </div>
      </CardContent>
    </Card>
  );
}
