'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumInput, PremiumSelect, PremiumSelectItem, PremiumTextarea } from '@/components/ui/premium-form';
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
          <CardContent className="space-y-8 pt-8 px-4 sm:px-6 lg:px-8">
            <PremiumInput
              label="School Name *"
              {...register('schoolName')}
              error={errors.schoolName?.message}
            />

            <div className="form-grid">
              <PremiumInput
                label="Location / Parish *"
                {...register('location')}
                error={errors.location?.message}
              />
              <PremiumInput
                label="Sub-County"
                {...register('subCounty')}
              />
              <PremiumInput
                label="District"
                {...register('district')}
              />
              <PremiumInput
                type="number"
                label="Enrollment Size"
                {...register('enrollmentSize')}
              />
            </div>

            <div className="pt-8 border-t border-dashed space-y-6">
              <h3 className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground w-full text-center">Contact Details</h3>
              <div className="form-grid">
                <PremiumInput
                  label="Patron Teacher *"
                  {...register('patronTeacher')}
                  error={errors.patronTeacher?.message}
                />
                <PremiumInput
                  label="Patron Phone"
                  {...register('patronPhone')}
                />
                <PremiumInput
                  type="email"
                  label="Patron Email"
                  {...register('patronEmail')}
                />
                <PremiumInput
                  label="Head Teacher"
                  {...register('headTeacher')}
                />
              </div>
            </div>

            <div className="pt-8 border-t border-dashed space-y-6">
              <h3 className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground w-full text-center">Programme Details</h3>
              <div className="space-y-3">
                <div className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading text-omuto-navy">Active Programmes *</div>
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

              <div className="form-grid lg:grid-cols-4">
                <Controller name="tier" control={control} render={({ field }) => (
                  <PremiumSelect label="Tier" value={field.value} onValueChange={field.onChange} error={errors.tier?.message}>
                    <PremiumSelectItem value="Partner">Partner</PremiumSelectItem>
                    <PremiumSelectItem value="Active">Active</PremiumSelectItem>
                    <PremiumSelectItem value="Advanced">Advanced</PremiumSelectItem>
                    <PremiumSelectItem value="Flagship">Flagship</PremiumSelectItem>
                  </PremiumSelect>
                )} />
                <Controller name="pipelineStage" control={control} render={({ field }) => (
                  <PremiumSelect label="Pipeline Stage" value={field.value} onValueChange={field.onChange} error={errors.pipelineStage?.message}>
                    <PremiumSelectItem value="Inquiry">Inquiry</PremiumSelectItem>
                    <PremiumSelectItem value="Meeting Booked">Meeting Booked</PremiumSelectItem>
                    <PremiumSelectItem value="MOU Signed">MOU Signed</PremiumSelectItem>
                    <PremiumSelectItem value="Onboarded">Onboarded</PremiumSelectItem>
                  </PremiumSelect>
                )} />
                <Controller name="status" control={control} render={({ field }) => (
                  <PremiumSelect label="Status" value={field.value} onValueChange={field.onChange} error={errors.status?.message}>
                    <PremiumSelectItem value="Registered">Registered</PremiumSelectItem>
                    <PremiumSelectItem value="Launched">Launched</PremiumSelectItem>
                    <PremiumSelectItem value="Active">Active</PremiumSelectItem>
                    <PremiumSelectItem value="Completed">Completed</PremiumSelectItem>
                    <PremiumSelectItem value="Inactive">Inactive</PremiumSelectItem>
                  </PremiumSelect>
                )} />
                <Controller name="term" control={control} render={({ field }) => (
                  <PremiumSelect label="Current Term" value={field.value} onValueChange={field.onChange} error={errors.term?.message}>
                    <PremiumSelectItem value="Term 1">Term 1</PremiumSelectItem>
                    <PremiumSelectItem value="Term 2">Term 2</PremiumSelectItem>
                    <PremiumSelectItem value="Term 3">Term 3</PremiumSelectItem>
                  </PremiumSelect>
                )} />
              </div>
            </div>

            <div className="pt-8 border-t border-dashed">
              <PremiumTextarea
                label="Notes"
                {...register('notes')}
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
