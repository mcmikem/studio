'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const programs = [
    {
        id: 'YAC',
        label: 'Young Alive Clubs (Adolescent Health, SRHR & Mental Health)',
        description: 'Student-led clubs focused on health and well-being, covering topics like sexual and reproductive health, mental health, healthy relationships, and life skills.'
    },
    {
        id: 'RED',
        label: 'RED Brigade (Menstrual Health Management & Period Poverty)',
        description: 'Empowers student leaders to fight period poverty, break down menstrual stigma, and ensure girls have the resources and support to manage their periods with dignity.'
    },
    {
        id: 'GreenSchools',
        label: 'GreenSchools (Environmental Awareness & Sustainability)',
        description: 'Helps students create a more environmentally conscious school through activities like school gardens, tree planting, recycling initiatives, and creating outdoor learning spaces.'
    },
    {
        id: 'Debate',
        label: 'Interschool Debate Competitions (SDGs & Youth Issues)',
        description: 'Encourages critical thinking and public speaking skills as students research, develop arguments, and respectfully debate important topics related to youth development and the Sustainable Development Goals (SDGs).'
    },
    {
        id: 'SLF',
        label: 'Student Leaders Forum (Leadership Training, Student/School representation)',
        description: 'The Forum trains student leaders in the school (prefects, class leaders, student Councillors) and two of the leaders represent the school on the Termly forums to discuss issues affecting students and their school'
    }
]

const schoolApplicationSchema = z.object({
  email: z.string().email(),
  schoolName: z.string().min(3, "School name is required."),
  schoolLocation: z.string().min(3, "School location is required."),
  schoolType: z.enum(['Primary', 'Secondary']),
  studentCount: z.coerce.number().min(1, "Number of students is required."),
  contactName: z.string().min(3, "Contact name is required."),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(10, "A valid phone number is required."),
  interestedPrograms: z.array(z.string()).min(1, "Please select at least one program."),
  existingHealthClubs: z.string().optional(),
  sustainabilityPlan: z.string().min(20, "Please provide more detail on your sustainability plan."),
  teacherSupport: z.enum(['1', '2', '3', 'More than 3']),
  yacGoals: z.string().optional(),
  redMhmResources: z.string().optional(),
  redPovertyImpact: z.string().optional(),
  greenExistingClubs: z.string().optional(),
  greenGardenAccess: z.enum(['Yes', 'No', 'Maybe']).optional(),
  debateStudentCount: z.string().optional(),
  debateClubExists: z.enum(['Yes', 'No']).optional(),
  additionalInfo: z.string().optional(),
});

type SchoolApplicationFormData = z.infer<typeof schoolApplicationSchema>;

export function SchoolApplicationForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SchoolApplicationFormData>({
    resolver: zodResolver(schoolApplicationSchema),
  });

  const interestedPrograms = watch('interestedPrograms', []);

  const onSubmit = async (data: SchoolApplicationFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
      return;
    }
    
    const applicationData = {
        ...data,
        createdAt: serverTimestamp()
    };

    try {
        await addDocumentNonBlocking(collection(firestore, 'school-applications'), applicationData);
        toast({
            title: 'Application Submitted!',
            description: 'Thank you for your interest. We will review your application and be in touch soon.',
        });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'There was an error submitting your application. Please try again.' });
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="pt-6 space-y-8">
          
          <div className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="email" className="font-bold required-indicator">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="your.email@example.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">School Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="schoolName" className="font-bold">School Name</Label>
                    <Input id="schoolName" {...register('schoolName')} />
                     {errors.schoolName && <p className="text-sm text-destructive">{errors.schoolName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="schoolLocation" className="font-bold">School Location (District, Region)</Label>
                    <Input id="schoolLocation" {...register('schoolLocation')} />
                    {errors.schoolLocation && <p className="text-sm text-destructive">{errors.schoolLocation.message}</p>}
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="font-bold">School Type</Label>
                    <Controller name="schoolType" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Primary" id="primary" /><Label htmlFor="primary">Primary</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Secondary" id="secondary" /><Label htmlFor="secondary">Secondary</Label></div>
                        </RadioGroup>
                    )} />
                     {errors.schoolType && <p className="text-sm text-destructive">{errors.schoolType.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="studentCount" className="font-bold">Number of Students</Label>
                    <Input id="studentCount" type="number" {...register('studentCount')} />
                     {errors.studentCount && <p className="text-sm text-destructive">{errors.studentCount.message}</p>}
                </div>
             </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="contactName" className="font-bold">Contact Name</Label>
                    <Input id="contactName" {...register('contactName')} />
                    {errors.contactName && <p className="text-sm text-destructive">{errors.contactName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="font-bold">Contact Email</Label>
                    <Input id="contactEmail" type="email" {...register('contactEmail')} />
                    {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="font-bold">Contact Phone Number</Label>
                    <Input id="contactPhone" {...register('contactPhone')} />
                    {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone.message}</p>}
                </div>
             </div>
          </div>

           <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Programs Interest</h3>
             <Controller
                name="interestedPrograms"
                control={control}
                render={({ field }) => (
                    <div className="space-y-4">
                        {programs.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                                <Checkbox
                                    id={item.id}
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(field.value?.filter((value) => value !== item.id))
                                    }}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{item.label}</label>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             />
             {errors.interestedPrograms && <p className="text-sm text-destructive">{errors.interestedPrograms.message}</p>}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Contextual Information</h3>
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
