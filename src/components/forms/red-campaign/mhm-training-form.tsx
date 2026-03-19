
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
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 lg:p-8">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl">
            <Droplets className="h-6 w-6" />
            MHM Training Report
          </CardTitle>
          <CardDescription>
            Log attendance and details for a Menstrual Health Management session.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="session" className="text-xs sm:text-sm truncate">Session Title</Label>
                <Input id="session" {...register('session')} placeholder="e.g., MHM Basics at St. Annes" className="h-10 sm:h-11" />
                {errors.session && <p className="text-xs sm:text-sm text-destructive">{errors.session.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs sm:text-sm">Date of Training</Label>
                <Input id="date" type="date" {...register('date')} className="h-10 sm:h-11" />
                {errors.date && <p className="text-xs sm:text-sm text-destructive">{errors.date.message}</p>}
              </div>
            </div>

            <div className="space-y-4 overflow-x-auto">
              <h3 className="text-lg sm:text-xl font-semibold border-b pb-2">Participants</h3>
               <div className="min-w-[500px]">
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
                       <TableCell><Input {...register(`participants.${index}.name`)} placeholder="Participant's Name" className="h-10 sm:h-11" /></TableCell>
                       <TableCell><Input type="number" {...register(`participants.${index}.age`)} placeholder="Age" className="h-10 sm:h-11" /></TableCell>
                       <TableCell><Input {...register(`participants.${index}.class`)} placeholder="e.g. P.7" className="h-10 sm:h-11" /></TableCell>
                       <TableCell>
                         <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
                </Table>
               </div>
               <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', age: 0, class: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Participant</Button>
               {errors.participants && <p className="text-xs sm:text-sm text-destructive">{errors.participants.message}</p>}
            </div>

          </CardContent>
          <CardFooter className="p-4 sm:p-6 lg:p-8">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Training Report
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
