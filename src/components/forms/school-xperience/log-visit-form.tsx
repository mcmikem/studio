'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
          <CardContent className="space-y-8 pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">School *</Label>
                <Controller
                  name="schoolId"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={(e) => {
                        const school = schools?.find((s) => s.id === e.target.value);
                        field.onChange(e.target.value);
                        setValue('schoolName', school?.schoolName || '');
                      }}
                      className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
                    >
                      <option value="">Select school...</option>
                      {schools?.map((s) => (
                        <option key={s.id} value={s.id}>{s.schoolName}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.schoolId && <p className="text-xs text-destructive font-bold">{errors.schoolId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Visit Date *</Label>
                <Input type="date" {...register('date')} className="border-lg rounded-xl h-12 font-bold" />
                {errors.date && <p className="text-xs text-destructive font-bold">{errors.date.message}</p>}
              </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Visitor Name *</Label>
                <Input {...register('visitor')} placeholder="e.g., Dianah Nakato" className="border-lg rounded-xl h-12 font-bold" />
                {errors.visitor && <p className="text-xs text-destructive font-bold">{errors.visitor.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Programmes Covered *</Label>
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

            <div className="pt-4 border-t border-dashed space-y-6">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Visit Report</h3>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Objectives Met *</Label>
                <Textarea
                  {...register('objectivesMet')}
                  placeholder="Describe what objectives were achieved during this visit..."
                  className="border-lg rounded-xl min-h-[100px] font-bold"
                />
                {errors.objectivesMet && <p className="text-xs text-destructive font-bold">{errors.objectivesMet.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Challenges Observed</Label>
                  <Textarea {...register('challengesObserved')} placeholder="Any challenges encountered..." className="border-lg rounded-xl min-h-[80px] font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Teacher Feedback</Label>
                  <Textarea {...register('teacherFeedback')} placeholder="Feedback from the patron teacher..." className="border-lg rounded-xl min-h-[80px] font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Student Feedback</Label>
                  <Textarea {...register('studentFeedback')} placeholder="Feedback from students..." className="border-lg rounded-xl min-h-[80px] font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Follow-up Actions</Label>
                  <Textarea {...register('followUpActions')} placeholder="What needs to be done next..." className="border-lg rounded-xl min-h-[80px] font-bold" />
                </div>
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
