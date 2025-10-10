
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
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
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { Project } from '@/lib/types';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';


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
        {/* Mobile View */}
        <div className="space-y-4 sm:hidden">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.manager}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Badge
                      variant="outline"
                      className={statusColors[project.status]}
                    >
                      {project.status}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {project.completion}%
                    </span>
                  </div>
                  <Progress value={project.completion} className="h-2" />
                  <div>
                    <p className="text-sm font-medium">Next Milestone:</p>
                    <p className="text-sm text-muted-foreground">
                      {project.nextMilestone}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingProject(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the project "{project.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(project)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))
          ) : (
            !isLoading && (
              <EmptyState
                icon={Briefcase}
                title="No Projects Found"
                description="Add a project to get started."
              />
            )
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Next Milestone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.manager}</TableCell>
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
                        <Progress
                          value={project.completion}
                          className="h-2 w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          {project.completion}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{project.nextMilestone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingProject(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the project "{project.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(project)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48">
                      <EmptyState
                        icon={Briefcase}
                        title="No Projects Found"
                        description="Add a project to get started."
                        className="min-h-0"
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
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
