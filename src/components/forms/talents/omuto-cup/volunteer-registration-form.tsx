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
import { LocationPicker } from '@/components/ui/location-picker';

const schema = z.object({
  name: z.string().min(2, 'Name is required.'),
  role: z.string().min(2, 'Role is required.'),
  contact: z.string().min(8, 'Contact is required.'),
  district: z.string().optional(),
  subcounty: z.string().optional(),
  parish: z.string().optional(),
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

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
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
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" {...register('name')} className="h-10 sm:h-11" />{errors.name && <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="contact">Phone Contact</Label><Input id="contact" {...register('contact')} className="h-10 sm:h-11" />{errors.contact && <p className="text-xs sm:text-sm text-destructive">{errors.contact.message}</p>}</div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Role</Label>
                <Controller name="role" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-10 sm:h-11"><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{roleOptions.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select>
                )} />
                {errors.role && <p className="text-xs sm:text-sm text-destructive">{errors.role.message}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <LocationPicker
                  districtValue={watch('district')}
                  subcountyValue={watch('subcounty')}
                  parishValue={watch('parish')}
                  onDistrictChange={(val) => setValue('district', val)}
                  onSubcountyChange={(val) => setValue('subcounty', val)}
                  onParishChange={(val) => setValue('parish', val)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Availability</Label>
                <Controller name="availability" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-10 sm:h-11"><SelectValue /></SelectTrigger><SelectContent>{['Full Day', 'Morning', 'Afternoon', 'Flexible'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
                )} />
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="skills">Skills / Experience</Label><Textarea id="skills" {...register('skills')} placeholder="First aid, crowd management, social media coverage..." className="min-h-[80px] sm:min-h-[100px]" /></div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" {...register('notes')} className="min-h-[80px] sm:min-h-[100px]" /></div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6"><Button type="submit" className="w-full h-10 sm:h-11" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Register Volunteer</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}
