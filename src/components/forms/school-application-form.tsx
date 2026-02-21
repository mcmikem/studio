
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, Building, ArrowRight, Sparkles } from 'lucide-react';

const programs = [
    { id: 'YAC', label: 'Young Alive Clubs', desc: 'Health & Well-being' },
    { id: 'RED', label: 'RED Brigade', desc: 'Menstrual Health' },
    { id: 'GreenSchools', label: 'GreenSchools', desc: 'Sustainability' },
    { id: 'Debate', label: 'Debate Hub', desc: 'Critical Thinking' },
    { id: 'SLF', label: 'Student Leaders', desc: 'Leadership Training' }
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
    
    const applicationData = { ...data, createdAt: serverTimestamp() };

    try {
        await addDocumentNonBlocking(collection(firestore, 'school-applications'), applicationData);
        toast({ title: 'Application Submitted!', description: 'Thank you. We will review your application soon.' });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'There was an error. Please try again.' });
    }
  };

  return (
    <Card className="card-comic-hero overflow-hidden">
      <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 p-8 md:p-12">
            <div className="p-3 bg-white border-lg border-omuto-navy/20 shadow-comic-sm rounded-2xl w-fit mb-6 rotate-[-2deg]">
                <Building className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-heading text-4xl font-black tracking-tight uppercase leading-none text-omuto-navy">
                School <span className="text-omuto-red underline decoration-4 underline-offset-4">Application</span>
            </CardTitle>
            <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-[0.2em] mt-2">Official Intake Frequency</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-8 md:p-12 space-y-12">
          
          {/* Section 1: Contact */}
          <div className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Primary Contact</span>
                <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="contactName" className="font-bold text-[10px] uppercase tracking-widest pl-1">Full Name</Label>
                    <Input id="contactName" {...register('contactName')} className="h-14 border-lg rounded-2xl focus-visible:ring-omuto-red text-omuto-navy font-bold" />
                    {errors.contactName && <p className="text-xs font-bold text-destructive pl-1 uppercase">{errors.contactName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="font-bold text-[10px] uppercase tracking-widest pl-1">Phone Number</Label>
                    <Input id="contactPhone" {...register('contactPhone')} className="h-14 border-lg rounded-2xl focus-visible:ring-omuto-red text-omuto-navy font-bold" />
                    {errors.contactPhone && <p className="text-xs font-bold text-destructive pl-1 uppercase">{errors.contactPhone.message}</p>}
                </div>
             </div>
          </div>
          
          {/* Section 2: School Detail */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">School Metadata</span>
                <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="schoolName" className="font-bold text-[10px] uppercase tracking-widest pl-1">Official School Name</Label>
                    <Input id="schoolName" {...register('schoolName')} className="h-14 border-lg rounded-2xl text-omuto-navy font-bold" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="schoolLocation" className="font-bold text-[10px] uppercase tracking-widest pl-1">Location / District</Label>
                    <Input id="schoolLocation" {...register('schoolLocation')} className="h-14 border-lg rounded-2xl text-omuto-navy font-bold" />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                 <div className="space-y-3">
                    <Label className="font-bold text-[10px] uppercase tracking-widest pl-1">Institution Type</Label>
                    <Controller name="schoolType" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <div className="flex items-center space-x-2 bg-muted/30 px-6 py-4 rounded-2xl border-lg border-transparent has-[:checked]:border-omuto-red has-[:checked]:bg-white transition-all cursor-pointer flex-1">
                                <RadioGroupItem value="Primary" id="primary" className="border-2" />
                                <Label htmlFor="primary" className="font-black uppercase text-xs cursor-pointer text-omuto-navy">Primary</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-muted/30 px-6 py-4 rounded-2xl border-lg border-transparent has-[:checked]:border-omuto-red has-[:checked]:bg-white transition-all cursor-pointer flex-1">
                                <RadioGroupItem value="Secondary" id="secondary" className="border-2" />
                                <Label htmlFor="secondary" className="font-black uppercase text-xs cursor-pointer text-omuto-navy">Secondary</Label>
                            </div>
                        </RadioGroup>
                    )} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="studentCount" className="font-bold text-[10px] uppercase tracking-widest pl-1">Population</Label>
                    <Input id="studentCount" type="number" {...register('studentCount')} className="h-14 border-lg rounded-2xl text-omuto-navy font-bold" />
                </div>
             </div>
          </div>

           {/* Section 3: Programs */}
           <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Action Pathways</span>
                <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
             </div>
             <Controller
                name="interestedPrograms"
                control={control}
                render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {programs.map((item) => (
                            <div key={item.id} className="relative group">
                                <div className={`h-full p-6 border-lg rounded-2xl transition-all cursor-pointer flex flex-col justify-between ${field.value?.includes(item.id) ? 'border-omuto-red bg-omuto-red text-white shadow-comic-sm -rotate-1' : 'border-omuto-navy/20 bg-white hover:border-omuto-navy/40'}`}>
                                    <Checkbox
                                        id={item.id}
                                        checked={field.value?.includes(item.id)}
                                        className="hidden"
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(field.value?.filter((value) => value !== item.id))
                                        }}
                                    />
                                    <label htmlFor={item.id} className="flex flex-col gap-1 cursor-pointer h-full">
                                        <div className="flex items-center justify-between">
                                            <span className={`font-black uppercase text-sm tracking-tight leading-tight ${field.value?.includes(item.id) ? 'text-white' : 'text-omuto-navy'}`}>{item.label}</span>
                                            {field.value?.includes(item.id) && <Sparkles className="h-4 w-4 text-omuto-yellow" />}
                                        </div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${field.value?.includes(item.id) ? 'text-white/70' : 'text-muted-foreground'}`}>{item.desc}</p>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             />
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Strategy & Capacity</span>
                <div className="h-1 flex-1 bg-omuto-navy/5 rounded-full" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="sustainabilityPlan" className="font-bold text-[10px] uppercase tracking-widest pl-1">Sustainability Strategy</Label>
                <Textarea id="sustainabilityPlan" {...register('sustainabilityPlan')} className="min-h-[120px] border-lg rounded-2xl p-6 text-omuto-navy font-bold" placeholder="How will your school maintain impact after Omuto's support?" />
                {errors.sustainabilityPlan && <p className="text-xs font-bold text-destructive pl-1 uppercase">{errors.sustainabilityPlan.message}</p>}
            </div>
             <div className="space-y-4">
                <Label className="font-bold text-[10px] uppercase tracking-widest pl-1">Teacher Commitment Force</Label>
                 <Controller name="teacherSupport" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {['1', '2', '3', 'More than 3'].map(val => (
                             <div key={val} className="flex flex-col items-center gap-2 flex-1">
                                <RadioGroupItem value={val} id={`t-${val}`} className="hidden" />
                                <Label htmlFor={`t-${val}`} className="w-full text-center py-4 bg-muted/30 border-lg border-transparent rounded-2xl font-black text-xs cursor-pointer hover:bg-white hover:border-omuto-navy/20 transition-all has-[:checked]:border-omuto-navy has-[:checked]:bg-omuto-yellow has-[:checked]:shadow-comic-sm has-[:checked]:text-omuto-navy">
                                    {val}
                                </Label>
                             </div>
                        ))}
                    </RadioGroup>
                )} />
            </div>
          </div>

          <Button type="submit" size="lg" className="btn-omuto w-full h-16 text-sm tracking-widest">
             {isSubmitting && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            SUBMIT ACTION REQUEST <ArrowRight className="ml-3 h-5 w-5" />
          </Button>

        </CardContent>
      </form>
    </Card>
  );
}
