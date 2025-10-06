'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
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
import { PlusCircle, Truck } from 'lucide-react';
import type { Project } from '@/lib/types';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusColors: { [key: string]: string } = {
  Active: 'border-green-500 bg-green-500/10 text-green-500',
  Moderate: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  'At Risk': 'border-orange-500 bg-orange-500/10 text-orange-500',
  Delayed: 'border-red-500 bg-red-500/10 text-red-500',
};

const projectSchema = z.object({
  name: z.string().min(3, 'Project name is required.'),
  manager: z.string().min(3, 'Manager name is required.'),
  districts: z.string().min(3, 'Districts are required.'),
  status: z.enum(['Active', 'Moderate', 'At Risk', 'Delayed']),
  completion: z.coerce.number().min(0).max(100, 'Completion must be between 0 and 100.'),
  nextMilestone: z.string().min(3, 'Next milestone is required.'),
});

function NewProjectForm({ onFormSubmit }: { onFormSubmit: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'Active',
      completion: 0,
    },
  });

  const onSubmit = async (data: z.infer<typeof projectSchema>) => {
    if (!firestore) return;
    const projectsCollection = collection(firestore, 'projects');
    const newProject = {
      ...data,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(projectsCollection, newProject);
    toast({
      title: 'Project Added!',
      description: `${data.name} has been added to your dashboard.`,
    });
    reset();
    onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g., RED Campaign School Tour" />
        {errors.name && <p className="text-sm text-destructive">{`${errors.name.message}`}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="manager">Manager</Label>
          <Input id="manager" {...register('manager')} placeholder="e.g., Nansikombi Dianah" />
          {errors.manager && <p className="text-sm text-destructive">{`${errors.manager.message}`}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="districts">Districts</Label>
          <Input id="districts" {...register('districts')} placeholder="e.g., Mpigi, Butambala" />
          {errors.districts && <p className="text-sm text-destructive">{`${errors.districts.message}`}</p>}
        </div>
      </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="At Risk">At Risk</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && <p className="text-sm text-destructive">{`${errors.status.message}`}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="completion">Completion (%)</Label>
            <Input id="completion" type="number" {...register('completion')} />
            {errors.completion && <p className="text-sm text-destructive">{`${errors.completion.message}`}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextMilestone">Next Milestone</Label>
        <Input id="nextMilestone" {...register('nextMilestone')} placeholder="e.g., Sign MoU with Nindye SS" />
        {errors.nextMilestone && <p className="text-sm text-destructive">{`${errors.nextMilestone.message}`}</p>}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Project'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Projects Overview</CardTitle>
          <CardDescription>
            A high-level view of all ongoing field projects.
          </CardDescription>
        </div>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>
                Define a new project to track on the dashboard.
              </DialogDescription>
            </DialogHeader>
            <NewProjectForm onFormSubmit={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Districts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Next Milestone</TableHead>
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
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                   <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                   <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                </TableRow>
              ))}
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                 <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.manager}</TableCell>
                    <TableCell>{project.districts}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[project.status]}
                      >
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.completion} className="h-2 w-24" />
                        <span className="text-xs text-muted-foreground">{project.completion}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{project.nextMilestone}</TableCell>
                  </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Truck className="h-12 w-12" />
                      <span className="text-lg font-semibold">
                        No Projects Found
                      </span>
                      <p className="text-sm">
                        Add a project to get started.
                      </p>
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
