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
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Heart } from 'lucide-react';
import { Suspense } from 'react';

const programOptions = ["RED Campaign (Menstrual Hygiene)", "GreenSchools (Environmental Action)", "Youth Debates"];

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
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schoolApplicationSchema)
  });

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
    

        
            
                
                    
                        Omuto School Programs Application Form
                        Thank you for your interest in bringing Omuto programs to your school! This form will help us understand your needs and match you with the most impactful program for your students.
                    
                
            
        

            
                 Email
                
                {errors.email &&  errors.email.message}
            
            
                 School Name
                
                {errors.schoolName &&  errors.schoolName.message}
            
            
                 School Location
                
                {errors.schoolLocation &&  errors.schoolLocation.message}
            
            
                 School Type
                
                  
                    
                    
                        
                            Primary
                            Secondary
                        
                    
                  
                
                {errors.schoolType &&  errors.schoolType.message}
            
            
                 Student Count
                
                {errors.studentCount &&  errors.studentCount.message}
            
            
                 Contact Name
                
                {errors.contactName &&  errors.contactName.message}
            
            
                 Contact Email
                
                {errors.contactEmail &&  errors.contactEmail.message}
            
            
                 Contact Phone
                
                {errors.contactPhone &&  errors.contactPhone.message}
            
            
                 Interested Programs
                
                  
                    
                        
                            
                            Select one or more programs
                        
                        
                            
                                {programOptions.map((program) => (
                                    
                                        {program}
                                    
                                ))}
                            
                        
                    
                  
                
                {errors.interestedPrograms &&  errors.interestedPrograms.message}
            
            
                 Existing Health Clubs
                
            
            
                 Sustainability Plan
                
                {errors.sustainabilityPlan &&  errors.sustainabilityPlan.message}
            
            
                 Teacher Support
                
                  
                    
                    
                        
                            1
                            2
                            3
                            More than 3
                        
                    
                  
                
            
            

            

            

            

            
                 Save Application
                
            
          
        
    
  );
}

export default function SchoolApplicationPage() {
    return (
        
            
                Back to MEAL Hub
            
        
        
            
                Back to MEAL Hub
            
        
        
            
                Back to MEAL Hub
            
        
        
            
                Back to MEAL Hub
            
        
        
            
                Back to MEAL Hub
            
        
    
}

    