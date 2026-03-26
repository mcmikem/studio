'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { Loader2, ArrowLeft, Building2, Check } from 'lucide-react';
import { OfflineStatus } from '@/components/ui/offline-status';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAutoSave, loadDraft, clearDraft } from '@/hooks/use-auto-save';
import { GPSLocationPicker } from '@/components/ui/gps-location-picker';

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
  tier: z.enum(['Partner', 'Active', 'Advanced', 'Flagship']).default('Partner'),
  status: z.enum(['Registered', 'Launched', 'Active', 'Completed', 'Inactive']).default('Registered'),
  pipelineStage: z.enum(['Inquiry', 'Meeting Booked', 'MOU Signed', 'Onboarded']).default('Inquiry'),
  activeProgrammes: z.array(z.enum(['SLF', 'RED', 'GreenSchools', 'PureWater', 'YoSkills'])).min(1, 'Select at least one programme'),
  term: z.enum(['Term 1', 'Term 2', 'Term 3']).default('Term 1'),
  academicYear: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  notes: z.string().optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

const PROGRAMMES = ['SLF', 'RED', 'GreenSchools', 'PureWater', 'YoSkills'] as const;

export function RegisterSchoolForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { submit } = useFormSubmission();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const schoolForm = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      schoolName: '',
      status: 'Registered',
      pipelineStage: 'Inquiry',
      term: 'Term 1',
      activeProgrammes: [],
    },
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting }, reset } = schoolForm;
  const selectedProgrammes = watch('activeProgrammes') || [];

  useEffect(() => {
    const savedDraft = loadDraft<SchoolFormData>('register-school');
    if (savedDraft) {
      Object.entries(savedDraft).forEach(([key, value]) => {
        setValue(key as keyof SchoolFormData, value as any)
      })
    }
  }, []);

  useAutoSave({ form: schoolForm, draftKey: 'register-school', delay: 2000 });

  const onSubmit = async (data: SchoolFormData) => {
    const result = await submit({
      collectionName: 'sx-schools',
      data: {
        ...data,
        coordinates: coordinates || undefined,
        academicYear: data.academicYear || new Date().getFullYear().toString(),
      },
    });

    if (result.isOffline) {
      toast({ title: 'Saved Offline', description: 'School queued — will sync when you reconnect.' });
    } else if (result.isQueued) {
      toast({ title: 'Saved', description: 'Queued for sync when connected.' });
      clearDraft('register-school');
    } else {
      toast({ title: 'School Registered', description: `${data.schoolName} has been registered for School Xperience.` });
      clearDraft('register-school');
    }
    router.push('/school-xperience');
  };

  return (
    <div className="enterprise-form-shell">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href="/school-xperience"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
      </Button>
      <Card className="border shadow-comic-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-card border shadow-comic-sm rounded-2xl flex-shrink-0">
                    <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                    <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy">
                        Partner <span className="text-omuto-red">Registration</span>
                    </CardTitle>
                    <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-wider mt-2">
                        School Xperience Partnership Programme Onboarding
                    </CardDescription>
                </div>
            </div>
            <div className="mt-4">
                <OfflineStatus />
            </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
            <div className="space-y-2">
              <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">School Name *</Label>
              <Input {...register('schoolName')} placeholder="e.g., St. Mary's Primary School" className="h-14 border rounded-2xl font-bold text-base bg-white" />
              {errors.schoolName && <p className="text-xs text-destructive font-bold uppercase pl-1">{errors.schoolName.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Location / Parish *</Label>
                <Input {...register('location')} placeholder="e.g., Bugiri Town" className="h-14 border rounded-2xl font-bold text-base bg-white" />
                {errors.location && <p className="text-xs text-destructive font-bold uppercase pl-1">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Sub-County</Label>
                <Input {...register('subCounty')} placeholder="e.g., Bugiri" className="h-14 border rounded-2xl font-bold text-base bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">District</Label>
                <Input {...register('district')} placeholder="e.g., Bugiri District" className="h-14 border rounded-2xl font-bold text-base bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Enrollment Size</Label>
                <Input type="number" {...register('enrollmentSize')} placeholder="e.g., 450" className="h-14 border rounded-2xl font-bold text-base bg-white" />
              </div>
            </div>

            <div className="pt-4 border-t border-dashed">
              <GPSLocationPicker
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                label="School GPS Location"
                description="Capture the school's exact coordinates for the interactive map"
              />
            </div>

            <div className="pt-8 border-t border-dashed space-y-6">
              <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-omuto-navy/40">Contact Details</span>
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Patron Teacher *</Label>
                  <Input {...register('patronTeacher')} placeholder="e.g., Mr. John Okello" className="h-14 border rounded-2xl font-bold text-base bg-white" />
                  {errors.patronTeacher && <p className="text-xs text-destructive font-bold uppercase pl-1">{errors.patronTeacher.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Patron Phone</Label>
                  <Input {...register('patronPhone')} placeholder="e.g., 0770 000 000" className="h-14 border rounded-2xl font-bold text-base bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Patron Email</Label>
                  <Input type="email" {...register('patronEmail')} placeholder="e.g., patron@school.edu" className="h-14 border rounded-2xl font-bold text-base bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Head Teacher</Label>
                  <Input {...register('headTeacher')} placeholder="e.g., Mrs. Jane Akurut" className="h-14 border rounded-2xl font-bold text-base bg-white" />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-dashed space-y-6">
               <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-omuto-navy/40">Programme Details</span>
                  <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Active Programmes *</Label>
                <Controller
                  name="activeProgrammes"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {PROGRAMMES.map((p) => (
                        <div
                          key={p}
                          onClick={() => {
                            const current = field.value || [];
                            if (current.includes(p)) {
                              field.onChange(current.filter((x) => x !== p));
                            } else {
                              field.onChange([...current, p]);
                            }
                          }}
                          className={`h-14 px-4 border-lg rounded-2xl transition-all cursor-pointer flex items-center justify-center text-center font-bold text-[10px] uppercase tracking-wider ${
                            field.value?.includes(p) ? 'border-omuto-red bg-white text-omuto-red shadow-comic-sm' : 'border-omuto-navy/5 bg-muted/30 text-omuto-navy/60 hover:border-omuto-navy/20'
                          }`}
                        >
                          {field.value?.includes(p) && <Check className="mr-1.5 h-3 w-3" />}
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                />
                {errors.activeProgrammes && <p className="text-xs text-destructive font-bold uppercase pl-1">{errors.activeProgrammes.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Tier</Label>
                  <Controller name="tier" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 border rounded-2xl font-bold text-omuto-navy bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Partner">Partner</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Flagship">Flagship</SelectItem>
                        </SelectContent>
                      </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Pipeline Stage</Label>
                  <Controller name="pipelineStage" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 border rounded-2xl font-bold text-omuto-navy bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Inquiry">Inquiry</SelectItem>
                            <SelectItem value="Meeting Booked">Meeting Booked</SelectItem>
                            <SelectItem value="MOU Signed">MOU Signed</SelectItem>
                            <SelectItem value="Onboarded">Onboarded</SelectItem>
                        </SelectContent>
                      </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Status</Label>
                  <Controller name="status" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 border rounded-2xl font-bold text-omuto-navy bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Registered">Registered</SelectItem>
                            <SelectItem value="Launched">Launched</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Current Term</Label>
                  <Controller name="term" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 border rounded-2xl font-bold text-omuto-navy bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Term 1">Term 1</SelectItem>
                            <SelectItem value="Term 2">Term 2</SelectItem>
                            <SelectItem value="Term 3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                  )} />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-8 border-t border-dashed">
              <Label className="font-bold text-[10px] uppercase tracking-wider pl-1 font-heading">Notes</Label>
              <textarea
                {...register('notes')}
                placeholder="Any additional information about the school..."
                className="w-full min-h-[100px] rounded-2xl border-lg border-input bg-white px-6 py-4 font-bold text-sm text-omuto-navy"
              />
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 lg:p-8 bg-muted/30 border-t border-omuto-navy/10">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-16 text-sm font-black uppercase tracking-widest shadow-comic-sm bg-omuto-red text-white border-white rounded-2xl">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Building2 className="mr-2 h-5 w-5" />}
              Register Partnership
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
