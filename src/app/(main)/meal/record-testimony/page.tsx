
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Mic, Video, StopCircle, Loader2, AlertTriangle, FileText, Save, Upload, Wand, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase, useFirebaseApp } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, orderBy } from 'firebase/firestore';
import { uploadFile } from '@/firebase/storage';
import { buildUploadPath } from '@/lib/upload-paths';
import { createTestimonyAction } from '@/actions/mutations';
import type { TestimonyOutput } from '@/lib/types';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const impactStorySchema = z.object({
  title: z.string().min(5, "A title for the story is required."),
  beneficiaryName: z.string().min(3, "Beneficiary name is required."),
  project: z.string().min(1, "Please select a project."),
  beforeSituation: z.string().min(10, "Please describe the 'before' situation."),
  afterSituation: z.string().min(10, "Please describe the 'after' situation."),
  quote: z.string().min(10, "Please provide a direct quote."),
  consentSigned: z.boolean().refine(val => val === true, {
    message: "You must confirm media consent has been signed.",
  }),
});

type ImpactStoryFormData = z.infer<typeof impactStorySchema>;

export default function RecordTestimonyPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const [isSaving, setIsSaving] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
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
  } = useForm<ImpactStoryFormData>({
    resolver: zodResolver(impactStorySchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: ImpactStoryFormData) => {
    if (!user || !profile || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Not Logged In or Firebase not ready' });
      return;
    }
    
    if (mediaFiles.length === 0) {
        toast({ variant: 'destructive', title: 'No Media', description: 'Please upload at least one photo or video.' });
        return;
    }

    setIsSaving(true);
    
    try {
        const uploadPromises = mediaFiles.map(file => {
            const path = buildUploadPath.testimonyMedia(user.uid, file.name);
            return uploadFile(firebaseApp, file, path);
        });

        const mediaUrls = await Promise.all(uploadPromises);

        const testimonyData = {
            ...data,
            userId: user.uid,
            userName: profile.name,
            mediaUrls,
        };

        const result = await createTestimonyAction(testimonyData);
        if (result.success) {
            toast({ title: 'Impact Story Saved!', description: 'Your story has been successfully captured.' });
        } else {
            throw new Error(result.error);
        }

    } catch(e) {
        console.error("Failed to save impact story", e);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'There was an error saving your story.' });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="flex flex-col gap-6">
       <Button variant="outline" asChild className="self-start">
        <Link href="/meal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to MEAL Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
            <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                <Video className="h-8 w-8" />
                Capture Impact Story
            </h1>
            <p className="text-muted-foreground">
                Record a success story with before/after details, quotes, and media.
            </p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Story Title</Label>
                    <Input id="title" {...register('title')} placeholder="e.g., Jane's Journey to MHM Independence" />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                        <Input id="beneficiaryName" {...register('beneficiaryName')} />
                        {errors.beneficiaryName && <p className="text-sm text-destructive">{errors.beneficiaryName.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="project">Project</Label>
                         {isLoadingPrograms ? <Skeleton className="h-10" /> : (
                            <Controller
                                name="project"
                                control={control}
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select a project..." /></SelectTrigger>
                                    <SelectContent>
                                        {programs?.map(p => <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                )}
                            />
                        )}
                        {errors.project && <p className="text-sm text-destructive">{errors.project.message}</p>}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="beforeSituation">"Before" Situation</Label>
                    <Textarea id="beforeSituation" {...register('beforeSituation')} placeholder="Describe the beneficiary's situation before Omuto's intervention." className="min-h-[100px]" />
                    {errors.beforeSituation && <p className="text-sm text-destructive">{errors.beforeSituation.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="afterSituation">"After" Situation</Label>
                    <Textarea id="afterSituation" {...register('afterSituation')} placeholder="Describe what changed for the beneficiary after the intervention." className="min-h-[100px]" />
                     {errors.afterSituation && <p className="text-sm text-destructive">{errors.afterSituation.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="quote">Direct Quote</Label>
                    <Textarea id="quote" {...register('quote')} placeholder='e.g., "I never knew I could make my own pads before today!" - Jane' className="min-h-[80px]" />
                    {errors.quote && <p className="text-sm text-destructive">{errors.quote.message}</p>}
                </div>

                 <div className="space-y-2">
                    <Label>Photos/Videos</Label>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Select Media
                        </Button>
                        <Input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleFileChange}/>
                        {mediaFiles.length > 0 && <p className="text-sm text-muted-foreground">{mediaFiles.length} file(s) selected.</p>}
                    </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                    <Controller name="consentSigned" control={control} render={({ field }) => <Checkbox id="consent" checked={field.value} onCheckedChange={field.onChange} />} />
                    <Label htmlFor="consent">I confirm that a signed media consent form has been obtained from the beneficiary.</Label>
                </div>
                 {errors.consentSigned && <p className="text-sm text-destructive">{errors.consentSigned.message}</p>}

            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Impact Story
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
