
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useAutosave } from '@/hooks/use-autosave';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';

const programOptions = [
    { id: 'YAC', label: 'Young Alive Clubs (Adolescent Health, SRHR & Mental Health)' },
    { id: 'RED', label: 'RED Brigade (Menstrual Health Management & Period Poverty)' },
    { id: 'GreenSchools', label: 'GreenSchools (Environmental Awareness & Sustainability)' },
    { id: 'Debate', label: 'Interschool Debate Competitions (SDGs & Youth Issues)' },
    { id: 'SLF', label: 'Student Leaders Forum (Leadership Training, Student/School representation)' },
];

const schoolApplicationSchema = z.object({
  email: z.string().email({ message: "Invalid email format." }),
  schoolName: z.string().min(3, "School name is required."),
  schoolLocation: z.string().min(3, "School location is required."),
  schoolType: z.enum(["Primary", "Secondary"], {
    required_error: "School type is required.",
  }),
  studentCount: z.coerce.number().min(1, "Student count is required."),
  contactName: z.string().min(3, "Contact name is required."),
  contactEmail: z.string().email({ message: "Invalid email format." }),
  contactPhone: z.string().min(10, "Phone number is required."),
  interestedPrograms: z.array(z.string()).min(1, "Select at least one program."),
  existingHealthClubs: z.string().optional(),
  sustainabilityPlan: z.string().min(10, "A brief plan is required."),
  teacherSupport: z.enum(["1", "2", "3", "More than 3"]),
  yacGoals: z.string().optional(),
  redMhmResources: z.string().optional(),
  redPovertyImpact: z.string().optional(),
  greenExistingClubs: z.string().optional(),
  greenGardenAccess: z.enum(["Yes", "No", "Maybe"]).optional(),
  debateStudentCount: z.string().optional(),
  debateClubExists: z.enum(["Yes", "No"]).optional(),
  additionalInfo: z.string().optional(),
});

type SchoolApplicationFormData = z.infer<typeof schoolApplicationSchema>;

function SchoolApplicationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<SchoolApplicationFormData>({
    resolver: zodResolver(schoolApplicationSchema),
    defaultValues: {
      interestedPrograms: [],
    },
  });

  const interestedPrograms = watch('interestedPrograms');

  // Auto-save functionality
  const formData = watch();
  const { debouncedSave, clearSaved, getSavedData, hasSavedData, lastSaved, isSaving } = useAutosave({
    storageKey: 'omuto-school-application',
    debounceMs: 2000,
  });


  // Auto-save when form data changes
  useEffect(() => {
    debouncedSave(formData);
  }, [formData, debouncedSave]);

  // Load saved data on mount
  useEffect(() => {
    if (hasSavedData()) {
      const savedData = getSavedData();
      if (savedData) {
        // Could implement form reset with saved data here if needed
        console.log('Saved form data available');
      }
    }
  }, [getSavedData, hasSavedData]);

  const onSubmit = async (data: SchoolApplicationFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }
      
    const applicationData = {
      ...data,
      createdAt: serverTimestamp(),
    };

    await addDocumentNonBlocking(collection(firestore, 'school-applications'), applicationData)
        .then(() => {
            clearSaved(); // Clear autosaved data on successful submission
            toast({ title: "Application Submitted!", description: "Your application has been successfully submitted." });
            router.push('/meal');
        })
        .catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit the application.' });
        });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Omuto School Programs Application Form</CardTitle>
            <CardDescription>
              Thank you for your interest in bringing Omuto programs to your school! This form will help us understand your needs and match you with the most impactful program for your students.
            </CardDescription>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Save className="h-3 w-3 animate-pulse" />
              <span>Saving...</span>
            </div>
          )}
          {!isSaving && lastSaved && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Save className="h-3 w-3 text-green-500" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-8">
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <span className="text-destructive font-bold">*</span> Required fields
            </p>
            <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input id="email" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-4">
                <h3 className="font-semibold border-b pb-1">School Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input id="schoolName" {...register('schoolName')} />
                        {errors.schoolName && <p className="text-sm text-destructive">{errors.schoolName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolLocation">School Location</Label>
                        <Input id="schoolLocation" {...register('schoolLocation')} />
                        {errors.schoolLocation && <p className="text-sm text-destructive">{errors.schoolLocation.message}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>School Type</Label>
                        <Controller
                            name="schoolType"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Primary" id="primary" /><Label htmlFor="primary">Primary</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Secondary" id="secondary" /><Label htmlFor="secondary">Secondary</Label></div>
                                </RadioGroup>
                            )}
                        />
                        {errors.schoolType && <p className="text-sm text-destructive">{errors.schoolType.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="studentCount">Student Count</Label>
                        <Input id="studentCount" type="number" {...register('studentCount')} />
                        {errors.studentCount && <p className="text-sm text-destructive">{errors.studentCount.message}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="contactName">Contact Name</Label>
                        <Input id="contactName" {...register('contactName')} />
                        {errors.contactName && <p className="text-sm text-destructive">{errors.contactName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input id="contactPhone" {...register('contactPhone')} />
                        {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone.message}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" {...register('contactEmail')} />
                    {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
                </div>
            </div>

            <div className="space-y-4">
                 <h3 className="font-semibold border-b pb-1">Programs of Interest</h3>
                  <Controller
                    name="interestedPrograms"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            {programOptions.map(program => (
                                <div key={program.id} className="flex items-start gap-2">
                                    <Checkbox
                                        id={program.id}
                                        checked={field.value?.includes(program.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), program.id])
                                            : field.onChange(field.value?.filter((value) => value !== program.id))
                                        }}
                                    />
                                    <Label htmlFor={program.id} className="cursor-pointer">{program.label}</Label>
                                </div>
                            ))}
                        </div>
                    )}
                  />
                {errors.interestedPrograms && <p className="text-sm text-destructive">{errors.interestedPrograms.message}</p>}
            </div>
            
            <div className="space-y-4">
                <h3 className="font-semibold border-b pb-1">Contextual Information</h3>
                <div className="space-y-2">
                    <Label htmlFor="existingHealthClubs">Briefly describe any existing health clubs or initiatives in your school.</Label>
                    <Textarea id="existingHealthClubs" {...register('existingHealthClubs')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sustainabilityPlan" className="font-bold">How will your school ensure these programs continue to benefit students after Omuto's initial support?</Label>
                    <Textarea id="sustainabilityPlan" {...register('sustainabilityPlan')} />
                    {errors.sustainabilityPlan && <p className="text-sm text-destructive">{errors.sustainabilityPlan.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="font-bold">Select number of teachers willing to actively support these programs</Label>
                    <Controller name="teacherSupport" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-6 pt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="1" id="t1" /><Label htmlFor="t1">1</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="2" id="t2" /><Label htmlFor="t2">2</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="3" id="t3" /><Label htmlFor="t3">3</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="More than 3" id="t4" /><Label htmlFor="t4">More than 3</Label></div>
                        </RadioGroup>
                    )} />
                </div>
            </div>

            {(interestedPrograms.length > 0) && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Program Specific Questions</h3>
                    {interestedPrograms.includes('YAC') && (
                        <div className="space-y-2 p-4 border rounded-md">
                            <Label htmlFor="yacGoals" className="font-bold">What are your specific goals for implementing a Young Alive Club?</Label>
                            <Textarea id="yacGoals" {...register('yacGoals')} />
                        </div>
                    )}
                    {interestedPrograms.includes('RED') && (
                        <div className="space-y-6 p-4 border rounded-md">
                            <div className="space-y-2">
                                <Label htmlFor="redMhmResources" className="font-bold">Does your school currently have any menstrual hygiene management resources or programs?</Label>
                                <Textarea id="redMhmResources" {...register('redMhmResources')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="redPovertyImpact" className="font-bold">How does period poverty impact girls' education at your school?</Label>
                                <Textarea id="redPovertyImpact" {...register('redPovertyImpact')} />
                            </div>
                        </div>
                    )}
                    {interestedPrograms.includes('GreenSchools') && (
                        <div className="space-y-6 p-4 border rounded-md">
                            <div className="space-y-2">
                                <Label htmlFor="greenExistingClubs" className="font-bold">Does your school have any existing environmental clubs or initiatives?</Label>
                                <Textarea id="greenExistingClubs" {...register('greenExistingClubs')} />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Do you have access to land or a space suitable for a school garden?</Label>
                                <Controller name="greenGardenAccess" control={control} render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="garden-yes" /><Label htmlFor="garden-yes">Yes</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="garden-no" /><Label htmlFor="garden-no">No</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="Maybe" id="garden-maybe" /><Label htmlFor="garden-maybe">Maybe</Label></div>
                                    </RadioGroup>
                                )} />
                            </div>
                        </div>
                    )}
                    {interestedPrograms.includes('Debate') && (
                        <div className="space-y-6 p-4 border rounded-md">
                            <div className="space-y-2">
                                <Label htmlFor="debateStudentCount" className="font-bold">How many students would be interested in participating in debate competitions?</Label>
                                <Input id="debateStudentCount" {...register('debateStudentCount')} />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Does your school have a debate club or any experience with debate activities?</Label>
                                <Controller name="debateClubExists" control={control} render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="debate-yes" /><Label htmlFor="debate-yes">Yes</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="debate-no" /><Label htmlFor="debate-no">No</Label></div>
                                    </RadioGroup>
                                )} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="additionalInfo">Please provide any other information you feel is relevant to your application, such as specific challenges or opportunities related to these programs in your school context.</Label>
                <Textarea id="additionalInfo" {...register('additionalInfo')} />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Application
            </Button>
        </CardContent>
      </form>
    </Card>
  );
}

export default function SchoolApplicationPage() {
    return (
        <Suspense>
            <div className="space-y-4">
                 <Button variant="outline" asChild>
                    <Link href="/meal">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to MEAL Hub
                    </Link>
                </Button>
                <SchoolApplicationForm />
            </div>
        </Suspense>
    )
}
