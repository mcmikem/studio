'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumInput, PremiumSelect, PremiumSelectItem, PremiumTextarea } from '@/components/ui/premium-form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, ClipboardCheck, Check, Star, WifiOff } from 'lucide-react';
import { OfflineStatus } from '@/components/ui/offline-status';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, Suspense, useEffect } from 'react';
import { useAutoSave, loadDraft, clearDraft } from '@/hooks/use-auto-save';
import type { SchoolXperience } from '@/lib/types';
import { PhotoUpload } from './photo-upload';
import { GPSLocationPicker } from '@/components/ui/gps-location-picker';

const visitSchema = z.object({
  schoolId: z.string().min(1, 'School is required'),
  schoolName: z.string().min(1, 'School name is required'),
  date: z.string().min(1, 'Date is required'),
  visitor: z.string().min(2, 'Visitor name is required'),
  programmesCovered: z.array(z.enum(['SLF', 'RED', 'GreenSchools', 'PureWater'])).min(1, 'Select at least one programme'),
  objectivesMet: z.string().min(10, 'Please describe the objectives met (at least 10 characters)'),
  challengesObserved: z.string().optional(),
  teacherFeedback: z.string().optional(),
  studentFeedback: z.string().optional(),
  followUpActions: z.string().optional(),
  photos: z.array(z.string()).optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  flagForStory: z.boolean().default(false),
});

type VisitFormData = z.infer<typeof visitSchema>;

const PROGRAMMES = ['SLF', 'RED', 'GreenSchools', 'PureWater'] as const;

function LogVisitFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { submit } = useFormSubmission();
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore]);

  const { data: schools } = useCollection<SchoolXperience>(schoolsQuery);

  const preselectedSchoolId = searchParams.get('schoolId') || '';
  const preselectedSchoolName = searchParams.get('schoolName') || '';

  const visitForm = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      schoolId: preselectedSchoolId,
      schoolName: preselectedSchoolName,
      date: new Date().toISOString().split('T')[0],
      programmesCovered: [],
      photos: [],
      flagForStory: false,
    },
  });

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting }, getValues } = visitForm;
  const selectedSchoolId = watch('schoolId');
  const selectedSchool = schools?.find((s) => s.id === selectedSchoolId);

  useEffect(() => {
    if (!preselectedSchoolId) {
      const savedDraft = loadDraft<VisitFormData>('log-visit');
      if (savedDraft) {
        Object.entries(savedDraft).forEach(([key, value]) => {
          setValue(key as keyof VisitFormData, value as any)
        })
      }
    }
  }, []);

  useAutoSave({ form: visitForm, draftKey: 'log-visit', delay: 2000 });

  const onSubmit = async (data: VisitFormData) => {
    const result = await submit({
      collectionName: 'sx-visits',
      data: {
        ...data,
        photos: photos,
        coordinates: coordinates || undefined,
      },
      idempotencyKey: `${data.schoolId}_${data.date}_${data.visitor}`.replace(/\s+/g, '_'),
    });

    if (result.isOffline) {
      toast({
        title: 'Saved Offline',
        description: 'Visit queued — will sync when you reconnect.',
      });
      router.push(data.schoolId ? `/school-xperience/${data.schoolId}` : '/school-xperience');
    } else if (result.isQueued) {
      toast({
        title: 'Saved',
        description: 'Queued for sync when connected.',
      });
      clearDraft('log-visit');
      router.push(data.schoolId ? `/school-xperience/${data.schoolId}` : '/school-xperience');
    } else {
      toast({
        title: 'Visit Logged',
        description: data.flagForStory
          ? 'Visit recorded with photos. Flagged for a story!'
          : 'Visit successfully recorded.',
      });
      clearDraft('log-visit');
      router.push(data.schoolId ? `/school-xperience/${data.schoolId}` : '/school-xperience');
    }
  };

  return (
    <div className="enterprise-form-shell">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href="/school-xperience"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
      </Button>
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            Log Monitoring Visit
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest">
            Record details from a field visit to a partner school.
          </CardDescription>
          <div className="mt-2">
            <OfflineStatus />
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8 px-4 sm:px-6 lg:px-8">
            <div className="form-grid">
              <Controller
                name="schoolId"
                control={control}
                render={({ field }) => (
                  <PremiumSelect
                    label="School *"
                    value={field.value}
                    onValueChange={(val) => {
                      const school = schools?.find((s) => s.id === val);
                      field.onChange(val);
                      setValue('schoolName', school?.schoolName || '');
                    }}
                    error={errors.schoolId?.message}
                    placeholder="Select school..."
                  >
                    {schools?.map((s) => (
                      <PremiumSelectItem key={s.id} value={s.id}>{s.schoolName}</PremiumSelectItem>
                    ))}
                  </PremiumSelect>
                )}
              />
              <PremiumInput
                type="date"
                label="Visit Date *"
                {...register('date')}
                error={errors.date?.message}
              />
            </div>

            {selectedSchool && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                <span className="font-bold">Selected:</span> {selectedSchool.schoolName}
                {selectedSchool.location && ` — ${selectedSchool.location}`}
                {selectedSchool.activeProgrammes && selectedSchool.activeProgrammes.length > 0 && (
                  <span className="ml-2">
                    ({selectedSchool.activeProgrammes.join(', ')})
                  </span>
                )}
              </div>
            )}

            <div className="form-grid">
              <PremiumInput
                label="Visitor Name *"
                placeholder="e.g., Dianah Nakato"
                {...register('visitor')}
                error={errors.visitor?.message}
              />
              <div className="space-y-2">
                <div className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1 font-heading text-omuto-navy">Programmes Covered *</div>
                <Controller
                  name="programmesCovered"
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
                {errors.programmesCovered && <p className="text-xs text-destructive font-bold">{errors.programmesCovered.message}</p>}
              </div>
            </div>

            <div className="pt-8 border-t border-dashed space-y-6">
              <h3 className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground w-full text-center">Visit Report</h3>
              <PremiumTextarea
                label="Objectives Met *"
                placeholder="Describe what objectives were achieved during this visit..."
                {...register('objectivesMet')}
                error={errors.objectivesMet?.message}
              />
              <div className="form-grid">
                <PremiumTextarea
                  label="Challenges Observed"
                  placeholder="Any challenges encountered..."
                  {...register('challengesObserved')}
                />
                <PremiumTextarea
                  label="Teacher Feedback"
                  placeholder="Feedback from the patron teacher..."
                  {...register('teacherFeedback')}
                />
                <PremiumTextarea
                  label="Student Feedback"
                  placeholder="Feedback from students..."
                  {...register('studentFeedback')}
                />
                <PremiumTextarea
                  label="Follow-up Actions"
                  placeholder="What needs to be done next..."
                  {...register('followUpActions')}
                />
              </div>

              <div className="pt-4 border-t border-dashed">
                <PhotoUpload
                  photos={photos}
                  onPhotosChange={setPhotos}
                  maxPhotos={5}
                />
              </div>

              <div className="pt-4 border-t border-dashed">
                <GPSLocationPicker
                  coordinates={coordinates}
                  onCoordinatesChange={setCoordinates}
                  label="Visit GPS Location"
                  description="Capture your current location or enter coordinates manually"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-bold text-sm">Flag for Story</p>
                  <p className="text-xs text-muted-foreground">Mark this visit as a story candidate for Alex's media team</p>
                </div>
              </div>
              <Controller
                name="flagForStory"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="enterprise-form-footer">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ClipboardCheck className="mr-2 h-5 w-5" />}
              Log Visit
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export function LogVisitForm() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LogVisitFormInner />
    </Suspense>
  );
}
