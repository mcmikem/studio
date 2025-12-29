
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Droplets, PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const participantSchema = z.object({
  name: z.string().min(3, "Name is required."),
  age: z.coerce.number().min(5, "Age is required."),
  class: z.string().optional(),
});

const mhmTrainingSchema = z.object({
  session: z.string().min(3, 'Session title is required.'),
  date: z.string().min(1, 'Date is required.'),
  participants: z.array(participantSchema).min(1, 'At least one participant is required.'),
});

type MhmTrainingFormData = z.infer<typeof mhmTrainingSchema>;

export function MhmTrainingForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MhmTrainingFormData>({
    resolver: zodResolver(mhmTrainingSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      participants: [{ name: '', age: 0, class: '' }]
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants"
  });

  const onSubmit = async (data: MhmTrainingFormData) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const validParticipants = data.participants.filter(p => p.name.trim() !== '');
    if (validParticipants.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter details for at least one participant.' });
        return;
    }

    const formData = {
      ...data,
      participants: validParticipants,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'mhm-trainings'), formData);
      toast({
        title: 'Training Logged!',
        description: `The MHM training session has been recorded.`,
      });
      reset();
      router.push('/meal');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to MEAL Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-6 w-6" />
            MHM Training Report
          </CardTitle>
          <CardDescription>
            Log attendance and details for a Menstrual Health Management session.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session">Session Title</Label>
                <Input id="session" {...register('session')} placeholder="e.g., MHM Basics at St. Annes" />
                {errors.session && <p className="text-sm text-destructive">{errors.session.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date of Training</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Participants</h3>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell><Input {...register(`participants.${index}.name`)} placeholder="Participant's Name" /></TableCell>
                      <TableCell><Input type="number" {...register(`participants.${index}.age`)} placeholder="Age"/></TableCell>
                      <TableCell><Input {...register(`participants.${index}.class`)} placeholder="e.g. P.7" /></TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
               </Table>
               <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', age: 0, class: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Participant</Button>
               {errors.participants && <p className="text-sm text-destructive">{errors.participants.message}</p>}
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Training Report
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
