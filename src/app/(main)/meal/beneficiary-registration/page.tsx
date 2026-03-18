
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
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <UserPlus className="h-5 sm:h-6 w-5 sm:w-6" />
          {beneficiaryId ? 'Edit Profile' : 'Beneficiary Registration Form'}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {beneficiaryId ? `Updating records for ${existingBeneficiary?.name || 'beneficiary'}` : 'Create a new profile for a beneficiary to track their journey with Omuto.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <Avatar className="h-20 sm:h-24 w-20 sm:w-24 border-2 border-dashed" data-ai-hint="person avatar">
                  <AvatarImage src={photoPreview || ''} />
                  <AvatarFallback className="bg-muted"><UserPlus className="h-8 sm:h-10 w-8 sm:w-10 text-muted-foreground"/></AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Photo
              </Button>
              <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">Full Name</Label>
              <Input id="name" {...register('name')} className="h-12" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-xs sm:text-sm">Date of Birth (optional)</Label>
              <Input id="dob" type="date" {...register('dob')} className="h-12" />
            </div>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Gender</Label>
                <Controller name="gender" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-3 sm:gap-4 pt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male" className="text-xs sm:text-sm">Male</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female" className="text-xs sm:text-sm">Female</Label></div>
                    </RadioGroup>
                )} />
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </div>
             <div className="space-y-4 pt-2 border-t">
              <Label className="text-sm font-semibold text-primary">Location Details</Label>
              <LocationPicker
                districtValue={watchDistrict}
                subcountyValue={watchSubcounty}
                parishValue={watchParish}
                onDistrictChange={(val) => setValue('district', val)}
                onSubcountyChange={(val) => setValue('subcounty', val)}
                onParishChange={(val) => setValue('parish', val)}
              />
              <div className="space-y-2">
                <Label htmlFor="village" className="text-xs sm:text-sm">Village / Zone</Label>
                <Input id="village" {...register('village')} className="h-12" placeholder="Optional" />
              </div>
            </div>
           </div>
           <div className="space-y-2">
               <Label htmlFor="programEnrolled" className="text-xs sm:text-sm">Program Enrolled In</Label>
                {isLoadingPrograms ? <Skeleton className="h-12 w-full" /> : (
                <Controller
                    name="programEnrolled"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="programEnrolled" className="h-12">
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
              {errors.programEnrolled && <p className="text-sm text-destructive">{errors.programEnrolled.message}</p>}
            </div>
          
          <div className="my-4 sm:my-6 border-t-2 border-dashed" />
            <h3 className="text-sm sm:text-md font-semibold text-muted-foreground">Optional Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                    <Label htmlFor="school" className="text-xs sm:text-sm">School (if applicable)</Label>
                    <Input id="school" {...register('school')} className="h-12" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
                    <Input id="phone" {...register('phone')} className="h-12" />
                </div>
            </div>
             <div className="space-y-2">
                 <Label htmlFor="guardianContact" className="text-xs sm:text-sm">Guardian's Name & Contact</Label>
                 <Input id="guardianContact" {...register('guardianContact')} className="h-12" />
            </div>
        </CardContent>
        <CardFooter className="p-4 sm:p-6">
          <Button type="submit" disabled={isSubmitting || !!(beneficiaryId && isLoadingBeneficiary)} className="w-full h-12">
            {isSubmitting ? (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                beneficiaryId ? <Save className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />
            )}
            {beneficiaryId ? 'Update Profile' : 'Register Beneficiary'}
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
