'use client';

import { useRef, useState, useEffect, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useCollection, useFirestore, useMemoFirebase, useFirebaseApp } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { uploadFile } from '@/firebase/storage';
import { buildUploadPath } from '@/lib/upload-paths';
import { createTestimonyAction, updateTestimonyAction } from '@/actions/mutations';
import { useToast } from '@/hooks/use-toast';
import { Program, Testimony } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationPicker } from '@/components/ui/location-picker';
import { ArrowLeft, Loader2, Save, Upload, Video, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/use-user-profile';
import { canEdit } from '@/lib/permissions';
import { getDownloadURL, ref } from 'firebase/storage';

const impactStorySchema = z.object({
  title: z.string().min(5, 'Title is required.'),
  beneficiaryName: z.string().min(2, 'Beneficiary name is required.'),
  district: z.string().min(1, 'District is required.'),
  subcounty: z.string().min(1, 'Subcounty is required.'),
  parish: z.string().optional(),
  project: z.string().min(1, 'Project is required.'),
  beforeSituation: z.string().min(20, 'Please describe the before situation.'),
  afterSituation: z.string().min(20, 'Please describe the after situation.'),
  quote: z.string().min(10, 'A direct quote is required.'),
  consentSigned: z.boolean().refine((val) => val === true, {
    message: 'Consent confirmation is required.',
  }),
});

type ImpactStoryFormData = z.infer<typeof impactStorySchema>;

export function CaptureImpactStoryForm({ backHref = '/meal' }: { backHref?: string }) {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const testimonyId = searchParams.get('id');

  const { data: fetchedTestimony, isLoading: isLoadingTestimony } = useDoc<Testimony>(
    firestore && testimonyId ? doc(firestore, 'testimonies', testimonyId) : null
  );

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const programsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'), orderBy('title'));
  }, [firestore]);

  const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ImpactStoryFormData>({
    resolver: zodResolver(impactStorySchema),
    defaultValues: { 
      consentSigned: false,
      district: 'Wakiso',
    },
  });

  const watchDistrict = watch('district');
  const watchSubcounty = watch('subcounty');
  const watchParish = watch('parish');

  useEffect(() => {
    if (fetchedTestimony) {
      reset({
        title: fetchedTestimony.title,
        beneficiaryName: fetchedTestimony.beneficiaryName,
        district: fetchedTestimony.district || 'Wakiso',
        subcounty: fetchedTestimony.subcounty || '',
        parish: fetchedTestimony.parish || '',
        project: fetchedTestimony.project,
        beforeSituation: fetchedTestimony.beforeSituation,
        afterSituation: fetchedTestimony.afterSituation,
        quote: fetchedTestimony.quote,
        consentSigned: fetchedTestimony.consentSigned,
      });
      setExistingMediaUrls(fetchedTestimony.mediaUrls || []);
    }
  }, [fetchedTestimony, reset]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setMediaFiles(Array.from(e.target.files));
  };

  const onSubmit = async (data: ImpactStoryFormData) => {
    if (!user || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Authentication error', description: 'Please log in again.' });
      return;
    }
    setIsSaving(true);

    try {
      const uploadPromises = mediaFiles.map((file) => {
        const path = buildUploadPath.testimonyMedia(user.uid, file.name);
        return uploadFile(firebaseApp, file, path);
      });
      const mediaUrls = await Promise.all(uploadPromises);

      const testimonyData = { 
        ...data, 
        mediaUrls: [...existingMediaUrls, ...mediaUrls], 
        userId: fetchedTestimony?.userId || user.uid,
        userName: fetchedTestimony?.userName || profile?.name || 'Omuto Member',
        updatedAt: testimonyId ? new Date() : undefined
      };

      const result = testimonyId 
        ? await updateTestimonyAction(testimonyId, testimonyData)
        : await createTestimonyAction(testimonyData);

      if (result.success) {
        toast({ title: testimonyId ? 'Impact Story Updated!' : 'Impact Story Saved!', description: 'Your story has been successfully captured.' });
        if (!testimonyId) {
            reset();
            setMediaFiles([]);
            setExistingMediaUrls([]);
        } else {
            router.push(backHref);
        }
      } else {
        throw new Error((result as any).error);
      }
    } catch (e) {
      console.error('Failed to save impact story', e);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'There was an error saving your story.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Button variant="outline" asChild className="self-start">
        <Link href={backHref}><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
      </Button>
      <Card>
        <CardHeader>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-8 w-8" />
            {testimonyId ? 'Update' : 'Capture'} Impact Story
          </h1>
          <p className="text-muted-foreground">
            {testimonyId ? `Modifying storyline: ${testimonyId}` : 'Record a success story with before/after details, quotes, and media.'}
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <MapPin className="h-4 w-4" /> Story Location
              </h3>
              <LocationPicker
                districtValue={watchDistrict}
                subcountyValue={watchSubcounty}
                parishValue={watchParish}
                onDistrictChange={(val) => setValue('district', val)}
                onSubcountyChange={(val) => setValue('subcounty', val)}
                onParishChange={(val) => setValue('parish', val)}
              />
            </div>
            
            <Separator className="my-6" />

            <div className="space-y-2"><Label htmlFor="title">Story Title</Label><Input id="title" {...register('title')} placeholder="e.g., How Jane found her spark in football" />{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="beneficiaryName">Beneficiary Name</Label><Input id="beneficiaryName" {...register('beneficiaryName')} />{errors.beneficiaryName && <p className="text-sm text-destructive">{errors.beneficiaryName.message}</p>}</div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                {isLoadingPrograms ? <Skeleton className="h-10" /> : (
                  <Controller name="project" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a project..." /></SelectTrigger><SelectContent>{programs?.map((p) => <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>)}</SelectContent></Select>
                  )} />
                )}
                {errors.project && <p className="text-sm text-destructive">{errors.project.message}</p>}
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="beforeSituation">"Before" Situation</Label><Textarea id="beforeSituation" {...register('beforeSituation')} className="min-h-[100px]" />{errors.beforeSituation && <p className="text-sm text-destructive">{errors.beforeSituation.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="afterSituation">"After" Situation</Label><Textarea id="afterSituation" {...register('afterSituation')} className="min-h-[100px]" />{errors.afterSituation && <p className="text-sm text-destructive">{errors.afterSituation.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="quote">Direct Quote</Label><Textarea id="quote" {...register('quote')} className="min-h-[80px]" />{errors.quote && <p className="text-sm text-destructive">{errors.quote.message}</p>}</div>
            <div className="space-y-4 pt-4">
              <Label>Photos/Videos</Label>
              <div className="flex flex-wrap gap-4 mb-4">
                {existingMediaUrls.map((url, i) => (
                    <div key={url} className="relative group">
                        <img src={url} alt={`Existing media ${i}`} className="h-24 w-24 object-cover rounded-lg border shadow-sm" />
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setExistingMediaUrls(prev => prev.filter(u => u !== url))}
                        >
                            ×
                        </Button>
                    </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />{existingMediaUrls.length > 0 ? 'Add More Media' : 'Select Media'}</Button>
                <Input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleFileChange} />
                {mediaFiles.length > 0 && <p className="text-sm text-muted-foreground">{mediaFiles.length} new file(s) selected.</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Controller name="consentSigned" control={control} render={({ field }) => (
                <Checkbox 
                  id="consent" 
                  checked={field.value === true} 
                  onCheckedChange={field.onChange} 
                />
              )} />
              <Label htmlFor="consent">I confirm that a signed media consent form has been obtained from the beneficiary.</Label>
            </div>
            {errors.consentSigned && <p className="text-sm text-destructive">{errors.consentSigned.message}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving || !!(testimonyId && isLoadingTestimony)} className="w-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {testimonyId ? 'REFRESH STORYLINE' : 'SAVE IMPACT STORY'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
