
'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, useFirebaseApp, useDoc } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus, Upload, ArrowLeft, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Program, Beneficiary } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile } from '@/firebase/storage';
import { buildUploadPath } from '@/lib/upload-paths';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LocationPicker } from '@/components/ui/location-picker';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBeneficiaryAction, updateBeneficiaryAction } from '@/actions/mutations';

const beneficiarySchema = z.object({
  name: z.string().min(1, 'Beneficiary name is required.'),
  dob: z.string().optional(),
  gender: z.enum(['Male', 'Female']),
  district: z.string().min(1, 'District is required.'),
  subcounty: z.string().min(1, 'Subcounty is required.'),
  parish: z.string().optional(),
  village: z.string().optional(),
  programEnrolled: z.string().min(1, 'Please select a program.'),
  school: z.string().optional(),
  phone: z.string().optional(),
  guardianContact: z.string().optional(),
  photo: z.any().optional(),
});

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

function BeneficiaryRegistrationForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const beneficiaryId = searchParams.get('id');

  const { data: existingBeneficiary, isLoading: isLoadingBeneficiary } = useDoc<Beneficiary>(
      firestore && beneficiaryId ? doc(firestore, 'beneficiaries', beneficiaryId) : null
  );

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
        gender: 'Female',
        district: 'Wakiso',
    }
  });

  useEffect(() => {
    if (existingBeneficiary) {
        reset({
            name: existingBeneficiary.name,
            dob: existingBeneficiary.dob || '',
            gender: existingBeneficiary.gender as any,
            district: existingBeneficiary.district || 'Wakiso',
            subcounty: existingBeneficiary.subcounty || '',
            parish: existingBeneficiary.parish || '',
            village: existingBeneficiary.village || '',
            programEnrolled: existingBeneficiary.programEnrolled,
            school: existingBeneficiary.school || '',
            phone: existingBeneficiary.phone || '',
            guardianContact: existingBeneficiary.guardianContact || '',
        });
        if (existingBeneficiary.photoURL) {
            setPhotoPreview(existingBeneficiary.photoURL);
        }
    }
  }, [existingBeneficiary, reset]);

  const watchDistrict = watch('district');
  const watchSubcounty = watch('subcounty');
  const watchParish = watch('parish');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setValue('photo', file);
          setPhotoPreview(URL.createObjectURL(file));
      }
  }

  const onSubmit = async (data: BeneficiaryFormData) => {
    if (!firestore || !user || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Application not ready', description: 'Please wait a moment and try again.' });
      return;
    }

    try {
        let photoURL: string | null = null;
        if (data.photo && data.photo instanceof File) {
            const path = buildUploadPath.beneficiaryPhoto(user.uid, data.photo.name);
            photoURL = await uploadFile(firebaseApp, data.photo, path);
        }

        const beneficiaryData = {
            name: data.name,
            dob: data.dob || '',
            gender: data.gender,
            district: data.district,
            subcounty: data.subcounty,
            parish: data.parish || '',
            village: data.village || '',
            programEnrolled: data.programEnrolled,
            userId: existingBeneficiary?.userId || user.uid,
            ...(photoURL && { photoURL }),
            ...(data.school && { school: data.school }),
            ...(data.phone && { phone: data.phone }),
            ...(data.guardianContact && { guardianContact: data.guardianContact }),
        };

        const result = beneficiaryId 
            ? await updateBeneficiaryAction(beneficiaryId, beneficiaryData)
            : await createBeneficiaryAction(beneficiaryData);

        if (result.success) {
            toast({
                title: beneficiaryId ? 'Profile Updated!' : 'Beneficiary Registered!',
                description: `${data.name} has been ${beneficiaryId ? 'updated' : 'added'} in the system.`,
            });
            if (!beneficiaryId) {
                reset();
                setPhotoPreview(null);
            }
            router.push('/meal/data/beneficiaries');
        } else {
            throw new Error((result as any).error);
        }
    } catch (error: any) {
        console.error("Firestore submission failed:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <Card className="w-full overflow-hidden border shadow-sm">
      <CardHeader className="bg-muted/30 border-b p-4 sm:p-6">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-white border shadow-sm rounded-xl flex-shrink-0">
                <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-lg font-bold tracking-tight text-omuto-navy">
                {beneficiaryId ? 'Edit Profile' : 'Beneficiary Registration'}
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {beneficiaryId ? `Updating records: ${existingBeneficiary?.name}` : 'Institutional Enrollment Terminal'}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col items-center space-y-4 p-6 bg-muted/20 border rounded-2xl">
              <Avatar className="h-24 w-24 border-2 border-dashed border-muted-foreground/30" data-ai-hint="person avatar">
                  <AvatarImage src={photoPreview || ''} />
                  <AvatarFallback className="bg-muted"><UserPlus className="h-10 w-10 text-muted-foreground/40"/></AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-full px-6 font-bold text-xs uppercase tracking-widest h-8">
                  <Upload className="mr-2 h-3.5 w-3.5" /> Upload Photo
              </Button>
              <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input id="name" {...register('name')} className="h-12 border rounded-xl font-semibold text-omuto-navy px-4" />
              {errors.name && <p className="text-xs text-destructive font-bold">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</Label>
              <Input id="dob" type="date" {...register('dob')} className="h-12 border rounded-xl font-semibold text-omuto-navy px-4" />
            </div>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
                <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</Label>
                <Controller name="gender" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 sm:gap-6 pt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male" className="text-sm font-semibold cursor-pointer">Male</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female" className="text-sm font-semibold cursor-pointer">Female</Label></div>
                    </RadioGroup>
                )} />
                {errors.gender && <p className="text-xs text-destructive font-bold">{errors.gender.message}</p>}
            </div>
            </div>
            <div className="space-y-4 pt-6 border-t border-muted">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary">Location Details</Label>
              <LocationPicker
                districtValue={watchDistrict}
                subcountyValue={watchSubcounty}
                parishValue={watchParish}
                onDistrictChange={(val) => setValue('district', val)}
                onSubcountyChange={(val) => setValue('subcounty', val)}
                onParishChange={(val) => setValue('parish', val)}
              />
              <div className="space-y-2">
                <Label htmlFor="village" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Village / Zone</Label>
                <Input id="village" {...register('village')} className="h-12 border rounded-xl font-semibold text-omuto-navy px-4" placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
               <Label htmlFor="programEnrolled" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Program Enrolled In</Label>
                 {isLoadingPrograms ? <Skeleton className="h-12 w-full rounded-xl" /> : (
                 <Controller
                     name="programEnrolled"
                     control={control}
                     render={({ field }) => (
                     <Select onValueChange={field.onChange} value={field.value}>
                         <SelectTrigger id="programEnrolled" className="h-12 border rounded-xl font-semibold text-omuto-navy px-4">
                             <SelectValue placeholder="Select a program..." />
                         </SelectTrigger>
                         <SelectContent>
                             {programs?.map(p => (
                                 <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                     )}
                 />
                )}
              {errors.programEnrolled && <p className="text-xs text-destructive font-bold">{errors.programEnrolled.message}</p>}
            </div>
           
           <div className="border-t border-dashed pt-6">
             <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Optional Metadata</h3>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                 <div className="space-y-2">
                     <Label htmlFor="school" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">School</Label>
                     <Input id="school" {...register('school')} className="h-12 border rounded-xl font-semibold text-omuto-navy px-4" />
                 </div>
                  <div className="space-y-2">
                     <Label htmlFor="phone" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                     <Input id="phone" {...register('phone')} className="h-12 border rounded-xl font-semibold text-omuto-navy px-4" />
                 </div>
             </div>
              <div className="space-y-2 mt-4">
                  <Label htmlFor="guardianContact" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Guardian&apos;s Name & Contact</Label>
                  <Input id="guardianContact" {...register('guardianContact')} className="h-12 border rounded-xl font-semibold text-omuto-navy px-4" />
             </div>
           </div>
        </CardContent>
        <CardFooter className="p-4 sm:p-6 bg-muted/30">
          <Button type="submit" disabled={isSubmitting || !!(beneficiaryId && isLoadingBeneficiary)} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-sm">
            {isSubmitting ? (
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                beneficiaryId ? <Save className="mr-2 h-5 w-5" /> : <UserPlus className="mr-2 h-5 w-5" />
            )}
            {beneficiaryId ? 'UPDATE INSTITUTIONAL PROFILE' : 'FINALIZE REGISTRATION'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


export default function BeneficiaryRegistrationPage() {
    return (
        <Suspense>
            <div className="space-y-4">
                <Button variant="outline" asChild>
                    <Link href="/meal">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to MEAL Hub
                    </Link>
                </Button>
                <BeneficiaryRegistrationForm />
            </div>
        </Suspense>
    )
}
