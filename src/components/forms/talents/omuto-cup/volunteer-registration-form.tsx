'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ArrowLeft, Loader2, UserPlus2 } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(2, 'Name is required.'),
  role: z.string().min(2, 'Role is required.'),
  contact: z.string().min(8, 'Contact is required.'),
  subcounty: z.string().optional(),
  availability: z.enum(['Full Day', 'Morning', 'Afternoon', 'Flexible']).default('Flexible'),
  skills: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type ExistingVolunteer = { id: string; subcounty?: string };

export function VolunteerRegistrationForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const volunteersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-volunteers'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: volunteers } = useCollection<ExistingVolunteer>(volunteersQuery);
  const roleOptions = ['Logistics', 'Health & Safety', 'Referee Support', 'Media', 'Registration Desk', 'Team Coordination'];
  const subcountyOptions = Array.from(new Set((volunteers || []).map((v) => v.subcounty).filter(Boolean))).sort();

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { availability: 'Flexible' },
  });

  const onSubmit = async (data: FormData) => {
    if (!firestore) return;
    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-volunteers'), {
        ...data,
        event: 'Omuto Cup',
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Volunteer Registered', description: `${data.name} has been added.` });
      reset({ availability: 'Flexible' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild><Link href="/meal/omuto-cup"><ArrowLeft className="mr-2 h-4 w-4" />Back to Omuto Cup Hub</Link></Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus2 className="h-6 w-6" />Volunteer Registration</CardTitle>
          <CardDescription>Register volunteers for Omuto Cup operations and planning.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" {...register('name')} />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="contact">Phone Contact</Label><Input id="contact" {...register('contact')} />{errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}</div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Controller name="role" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{roleOptions.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select>
                )} />
                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="subcounty">Subcounty</Label><Input id="subcounty" list="subcounty-options" {...register('subcounty')} placeholder="e.g., Kasanje" /><datalist id="subcounty-options">{subcountyOptions.map(s => <option key={s} value={s} />)}</datalist></div>
              <div className="space-y-2 md:col-span-2">
                <Label>Availability</Label>
                <Controller name="availability" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Full Day', 'Morning', 'Afternoon', 'Flexible'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
                )} />
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="skills">Skills / Experience</Label><Textarea id="skills" {...register('skills')} placeholder="First aid, crowd management, social media coverage..." /></div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" {...register('notes')} /></div>
          </CardContent>
          <CardFooter><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Register Volunteer</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}
