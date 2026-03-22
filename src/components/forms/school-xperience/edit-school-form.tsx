'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2, ArrowLeft, Building2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import type { SchoolXperience } from '@/lib/types';

const schoolSchema = z.object({
  schoolName: z.string().min(3, 'School name is required'),
  location: z.string().min(2, 'Location is required'),
  subCounty: z.string().optional(),
  district: z.string().optional(),
  patronTeacher: z.string().min(3, 'Patron teacher name is required'),
  patronPhone: z.string().optional(),
  patronEmail: z.string().email().optional().or(z.literal('')),
  headTeacher: z.string().optional(),
  enrollmentSize: z.coerce.number().min(1).optional(),
  tier: z.enum(['Partner', 'Active', 'Advanced', 'Flagship']),
  status: z.enum(['Registered', 'Launched', 'Active', 'Completed', 'Inactive']),
  pipelineStage: z.enum(['Inquiry', 'Meeting Booked', 'MOU Signed', 'Onboarded']),
  activeProgrammes: z.array(z.enum(['SLF', 'RED', 'GreenSchools', 'PureWater', 'YoSkills'])).min(1, 'Select at least one programme'),
  term: z.enum(['Term 1', 'Term 2', 'Term 3']),
  academicYear: z.string().optional(),
  notes: z.string().optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

const PROGRAMMES = ['SLF', 'RED', 'GreenSchools', 'PureWater', 'YoSkills'] as const;

export function EditSchoolForm({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const schoolDoc = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'sx-schools', schoolId);
  }, [firestore, schoolId]);

  const { data: school, isLoading } = useDoc<SchoolXperience>(schoolDoc);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      schoolName: school?.schoolName || '',
      location: school?.location || '',
      subCounty: school?.subCounty || '',
      district: school?.district || '',
      patronTeacher: school?.patronTeacher || '',
      patronPhone: school?.patronPhone || '',
      patronEmail: school?.patronEmail || '',
      headTeacher: school?.headTeacher || '',
      enrollmentSize: school?.enrollmentSize || 0,
      tier: school?.tier || 'Partner',
      status: school?.status || 'Registered',
      pipelineStage: school?.pipelineStage || 'Inquiry',
      activeProgrammes: school?.activeProgrammes || [],
      term: school?.term || 'Term 1',
      academicYear: school?.academicYear || '',
      notes: school?.notes || '',
    },
  });

  if (school && !isLoading) {
    reset({
      schoolName: school.schoolName || '',
      location: school.location || '',
      subCounty: school.subCounty || '',
      district: school.district || '',
      patronTeacher: school.patronTeacher || '',
      patronPhone: school.patronPhone || '',
      patronEmail: school.patronEmail || '',
      headTeacher: school.headTeacher || '',
      enrollmentSize: school.enrollmentSize || 0,
      tier: school.tier || 'Partner',
      status: school.status || 'Registered',
      pipelineStage: school.pipelineStage || 'Inquiry',
      activeProgrammes: school.activeProgrammes || [],
      term: school.term || 'Term 1',
      academicYear: school.academicYear || '',
      notes: school.notes || '',
    });
  }

  const selectedProgrammes = watch('activeProgrammes') || [];

  const onSubmit = (data: SchoolFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    updateDocumentNonBlocking(doc(firestore, 'sx-schools', schoolId), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    toast({ title: 'School Updated', description: `${data.schoolName} has been updated.` });
    router.push(`/school-xperience/${schoolId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-20">
        <p className="font-bold">School not found.</p>
        <Button asChild className="mt-4"><Link href="/school-xperience">Back to Hub</Link></Button>
      </div>
    );
  }

  return (
    <div className="enterprise-form-shell">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href={`/school-xperience/${schoolId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile</Link>
      </Button>
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter">
            <Building2 className="h-8 w-8 text-primary" />
            Edit School
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest">
            Update details for {school.schoolName}.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest">School Name *</Label>
              <Input {...register('schoolName')} className="border-lg rounded-xl h-12 font-bold" />
              {errors.schoolName && <p className="text-xs text-destructive font-bold">{errors.schoolName.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Location / Parish *</Label>
                <Input {...register('location')} className="border-lg rounded-xl h-12 font-bold" />
                {errors.location && <p className="text-xs text-destructive font-bold">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Sub-County</Label>
                <Input {...register('subCounty')} className="border-lg rounded-xl h-12 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">District</Label>
                <Input {...register('district')} className="border-lg rounded-xl h-12 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Enrollment Size</Label>
                <Input type="number" {...register('enrollmentSize')} className="border-lg rounded-xl h-12 font-bold" />
              </div>
            </div>

            <div className="pt-4 border-t border-dashed space-y-6">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Contact Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Patron Teacher *</Label>
                  <Input {...register('patronTeacher')} className="border-lg rounded-xl h-12 font-bold" />
                  {errors.patronTeacher && <p className="text-xs text-destructive font-bold">{errors.patronTeacher.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Patron Phone</Label>
                  <Input {...register('patronPhone')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Patron Email</Label>
                  <Input type="email" {...register('patronEmail')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Head Teacher</Label>
                  <Input {...register('headTeacher')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Programme Details</h3>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Active Programmes *</Label>
                <Controller
                  name="activeProgrammes"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {PROGRAMMES.map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant={field.value?.includes(p) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const current = field.value || [];
                            if (current.includes(p)) {
                              field.onChange(current.filter((x) => x !== p));
                            } else {
                              field.onChange([...current, p]);
                            }
                          }}
                          className={`h-10 rounded-xl font-bold text-xs ${
                            field.value?.includes(p) ? 'bg-primary text-primary-foreground border-primary' : ''
                          }`}
                        >
                          {field.value?.includes(p) && <Check className="mr-1 h-3 w-3" />}
                          {p}
                        </Button>
                      ))}
                    </div>
                  )}
                />
                {errors.activeProgrammes && <p className="text-xs text-destructive font-bold">{errors.activeProgrammes.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Tier</Label>
                  <select {...register('tier')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="Partner">Partner</option>
                    <option value="Active">Active</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Flagship">Flagship</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Pipeline Stage</Label>
                  <select {...register('pipelineStage')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="Inquiry">Inquiry</option>
                    <option value="Meeting Booked">Meeting Booked</option>
                    <option value="MOU Signed">MOU Signed</option>
                    <option value="Onboarded">Onboarded</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Status</Label>
                  <select {...register('status')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="Registered">Registered</option>
                    <option value="Launched">Launched</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Current Term</Label>
                  <select {...register('term')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-dashed">
              <Label className="font-bold text-xs uppercase tracking-widest">Notes</Label>
              <textarea
                {...register('notes')}
                className="w-full min-h-[80px] rounded-xl border-lg border-input bg-background px-3 py-2 font-bold text-sm"
              />
            </div>
          </CardContent>
          <CardFooter className="enterprise-form-footer">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Building2 className="mr-2 h-5 w-5" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
