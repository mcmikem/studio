'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Clock, Briefcase, PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import type { Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';


const statusIcons: { [key: string]: React.ReactNode } = {
    "On Track": <CheckCircle2 className="h-4 w-4 text-green-500" />,
    "At Risk": <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    "Delayed": <Clock className="h-4 w-4 text-red-500" />,
    "Completed": <CheckCircle2 className="h-4 w-4 text-primary" />
};

const statusColors: { [key: string]: string } = {
    "On Track": "border-green-500 bg-green-500/10 text-green-500",
    "At Risk": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "Delayed": "border-red-500 bg-red-500/10 text-red-500",
    "Completed": "border-primary bg-primary/10 text-primary",
};

const programSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description is too short."),
  lead: z.string().min(2, "Lead name is required."),
  status: z.enum(["On Track", "At Risk", "Delayed", "Completed"]),
  deadline: z.string().min(1, "Deadline is required."),
  objectives: z.string().min(10, "Objectives are required."),
});

function NewProgramForm({ onFormSubmit }: { onFormSubmit: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(programSchema),
  });

  const onSubmit = async (data: z.infer<typeof programSchema>) => {
    if (!firestore) return;
    const programsCollection = collection(firestore, 'programs');
    const newProgram = {
      ...data,
      objectives: data.objectives.split('\n').filter(o => o.trim() !== ''),
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(programsCollection, newProgram);
    toast({
      title: "Program Added!",
      description: `${data.title} has been added to your program tracker.`,
    });
    reset();
    onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Program Title</Label>
        <Input id="title" {...register("title")} placeholder="e.g., RED Campaign" />
        {errors.title && <p className="text-sm text-destructive">{`${errors.title.message}`}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} placeholder="A brief description of the program." />
        {errors.description && <p className="text-sm text-destructive">{`${errors.description.message}`}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lead">Program Lead</Label>
          <Input id="lead" {...register("lead")} placeholder="e.g., Dianah" />
          {errors.lead && <p className="text-sm text-destructive">{`${errors.lead.message}`}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" {...register("deadline")} placeholder="e.g., Oct 31, 2025" />
          {errors.deadline && <p className="text-sm text-destructive">{`${errors.deadline.message}`}</p>}
        </div>
      </div>
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
                  <SelectItem value="On Track">On Track</SelectItem>
                  <SelectItem value="At Risk">At Risk</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && <p className="text-sm text-destructive">{`${errors.status.message}`}</p>}
        </div>
      <div className="space-y-2">
        <Label htmlFor="objectives">Key Objectives</Label>
        <Textarea id="objectives" {...register("objectives")} placeholder="List each objective on a new line." />
        {errors.objectives && <p className="text-sm text-destructive">{`${errors.objectives.message}`}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>Add Program</Button>
      </DialogFooter>
    </form>
  );
}


export default function ProgramsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const programsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'), orderBy('title'));
  }, [firestore]);
  const { data: programs, isLoading } = useCollection<Program>(programsQuery);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Program Tracker
          </h1>
          <p className="text-muted-foreground">
            A high-level overview of all Omuto Foundation programs and their current status.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Program
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Program</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new program to the tracker.
              </DialogDescription>
            </DialogHeader>
            <NewProgramForm onFormSubmit={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <div className="mt-4 pt-4 border-t">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {programs && programs.length > 0 ? (
          programs.map((program) => (
            <Card key={program.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{program.title}</CardTitle>
                  <Badge variant="outline" className={statusColors[program.status]}>
                    <div className="flex items-center gap-1">
                      {statusIcons[program.status]}
                      {program.status}
                    </div>
                  </Badge>
                </div>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                  <div>
                      <h4 className="font-semibold text-sm mb-2">Key Objectives:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {program.objectives.map((obj, index) => (
                              <li key={index}>{obj}</li>
                          ))}
                      </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                      <div className="text-xs text-muted-foreground">
                          <p><strong>Lead:</strong> {program.lead}</p>
                          <p><strong>Deadline:</strong> {program.deadline}</p>
                      </div>
                  </div>
              </CardContent>
            </Card>
          ))
        ) : (
            !isLoading && (
                 <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                            <Briefcase className="h-16 w-16 text-muted-foreground" />
                            <p className="mt-4 text-lg font-semibold">No Programs Found</p>
                            <p className="mt-1 text-sm text-muted-foreground">Get started by adding the first program using the 'New Program' button.</p>
                        </div>
                    </CardContent>
                </Card>
            )
        )}
      </div>
    </div>
  );
}
