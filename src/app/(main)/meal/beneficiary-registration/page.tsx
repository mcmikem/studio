
'use client';

import { Suspense, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase, useUser, useFirebaseApp } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus, Upload, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Program, Beneficiary, OFATeam, SLF_School } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile } from '@/firebase/storage';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const beneficiarySchema = z.object({
  name: z.string().min(3, 'Beneficiary name is required.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  gender: z.enum(['Male', 'Female']),
  village: z.string().min(3, 'Village is required.'),
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
    formState: { errors, isSubmitting },
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
        gender: 'Female',
    }
  });

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
            const path = `beneficiary-photos/${user.uid}/${Date.now()}_${data.photo.name}`;
            photoURL = await uploadFile(firebaseApp, data.photo, path);
        }

        const beneficiaryData: Omit<Beneficiary, 'id'> = {
            name: data.name,
            dob: data.dob,
            gender: data.gender,
            village: data.village,
            programEnrolled: data.programEnrolled,
            createdAt: serverTimestamp() as Timestamp,
            ...(photoURL && { photoURL }),
            ...(data.school && { school: data.school }),
            ...(data.phone && { phone: data.phone }),
            ...(data.guardianContact && { guardianContact: data.guardianContact }),
        };

        await addDocumentNonBlocking(collection(firestore, 'beneficiaries'), beneficiaryData);
        toast({
            title: 'Beneficiary Registered!',
            description: `${data.name} has been added to the system.`,
        });
        reset();
        setPhotoPreview(null);
        router.push('/meal/data/beneficiaries');
    } catch (error: any) {
        console.error("Firestore submission failed:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          Beneficiary Registration Form
        </CardTitle>
        <CardDescription>
          Create a new profile for a beneficiary to track their journey with Omuto.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 border-2 border-dashed" data-ai-hint="person avatar">
                  <AvatarImage src={photoPreview || ''} />
                  <AvatarFallback className="bg-muted"><UserPlus className="h-10 w-10 text-muted-foreground"/></AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Photo
              </Button>
              <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" {...register('dob')} />
              {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Gender</Label>
                <Controller name="gender" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male">Male</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female">Female</Label></div>
                    </RadioGroup>
                )} />
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="village">Village / Location</Label>
              <Input id="village" {...register('village')} />
              {errors.village && <p className="text-sm text-destructive">{errors.village.message}</p>}
            </div>
           </div>
           <div className="space-y-2">
              <Label htmlFor="programEnrolled">Program Enrolled In</Label>
               {isLoadingPrograms ? <Skeleton className="h-10 w-full" /> : (
                <Controller
                    name="programEnrolled"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="programEnrolled">
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
          
          <div className="my-6 border-t-2 border-dashed" />
            <h3 className="text-md font-semibold text-muted-foreground">Optional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="school">School (if applicable)</Label>
                    <Input id="school" {...register('school')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" {...register('phone')} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="guardianContact">Guardian's Name & Contact</Label>
                <Input id="guardianContact" {...register('guardianContact')} />
            </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Beneficiary
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
