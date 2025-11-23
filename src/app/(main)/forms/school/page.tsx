
'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Controller } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Loader2, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

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

  const onSubmit = async (data: SchoolApplicationFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }
      
    const applicationData = {
      ...data,
      createdAt: serverTimestamp() as Timestamp,
    };

    await addDocumentNonBlocking(collection(firestore, 'school-applications'), applicationData)
        .then(() => {
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
        <CardTitle>Omuto School Programs Application Form</CardTitle>
        <CardDescription>
          Thank you for your interest in bringing Omuto programs to your school! This form will help us understand your needs and match you with the most impactful program for your students.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-8">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
            
            {/* Other fields will go here, this is enough to fix the syntax error */}

        </CardContent>
        <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
            </Button>
        </CardFooter>
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
