
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { PlusCircle, Edit, Trash2, ArrowRight } from 'lucide-react';
import type { Project } from '@/lib/types';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';


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

type ProjectFormData = z.infer<typeof projectSchema>;


function ProjectForm({
  project,
  onFormSubmit,
}: {
  project?: Project;
  onFormSubmit: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ? {
      ...project,
      completion: project.completion || 0
    } : {
      status: 'Active',
      completion: 0,
    },
  });

  const onSubmit = async (data: z.infer<typeof projectSchema>) => {
    if (!firestore) return;
    
    if (project) {
        // Update existing project
        const projectRef = doc(firestore, 'projects', project.id);
        updateDocumentNonBlocking(projectRef, data);
        toast({
            title: 'Project Updated!',
            description: `${data.name} has been successfully updated.`,
        });
    } else {
        // Add new project
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
    }

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {isSubmitting ? (project ? 'Saving...' : 'Adding...') : (project ? 'Save Changes' : 'Add Project')}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ProjectCard({ project, onEdit, onDelete }: { project: Project, onEdit: () => void, onDelete: () => void }) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                     <Badge
                        variant="outline"
                        className={statusColors[project.status]}
                      >
                        {project.status}
                      </Badge>
                </div>
                <CardDescription>Managed by {project.manager}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 <div className="space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>{project.completion}%</span>
                    </div>
                    <Progress value={project.completion} />
                 </div>
                 <div className="mt-4">
                    <p className="text-sm font-semibold">Next Milestone</p>
                    <p className="text-sm text-muted-foreground">{project.nextMilestone}</p>
                 </div>
            </CardContent>
            <CardFooter className="justify-between">
                <Button variant="outline" asChild size="sm">
                    <Link href={`/management/projects/${project.id}`}>
                        View Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This will permanently delete the project "{project.name}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardFooter>
        </Card>
    )
}

export default function ProjectsPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const firestore = useFirestore();
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  const handleDelete = (project: Project) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', project.id);
    deleteDocumentNonBlocking(projectRef);
    toast({
        title: "Project Deleted",
        description: `The project "${project.name}" has been removed.`,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle>Projects Tracker</CardTitle>
          <CardDescription>
            A high-level view of all ongoing field projects.
          </CardDescription>
        </div>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
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
            <ProjectForm onFormSubmit={() => setIsNewDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
          {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
              </div>
          )}
          {!isLoading && projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onEdit={() => setEditingProject(project)}
                        onDelete={() => handleDelete(project)}
                    />
                ))}
              </div>
          ) : (
            !isLoading && (
              <EmptyState
                icon={Briefcase}
                title="No Projects Found"
                description="Add a project to get started."
              />
            )
          )}
      </CardContent>
      {editingProject && (
        <Dialog
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update the details for the "{editingProject.name}" project.
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              project={editingProject}
              onFormSubmit={() => setEditingProject(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
