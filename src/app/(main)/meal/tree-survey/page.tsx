'use client';

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
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, Timestamp, query, orderBy } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Heart, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format, formatRelative } from 'date-fns';
import { Suspense } from 'react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const treeSurveySchema = z.object({
  originalPlantingActivityId: z.string().min(3, "Please select the original tree planting activity."),
  surveyDate: z.string().min(1, "Date of survey is required."),
  numberOfTreesSurvived: z.coerce.number().min(0, "Number of trees survived is required."),
  conditionOfTrees: z.enum(["Good", "Fair", "Poor"], {
    required_error: "Condition of trees is required.",
  }),
  notes: z.string().optional(),
});

type TreeSurveyFormData = z.infer<typeof treeSurveySchema>;

function formatDateSafe(timestamp: any, type: 'dateOnly' | 'relative' = 'relative') {
  if (!timestamp || !timestamp.toDate) {
    return 'Invalid Date';
  }

  const date = timestamp.toDate();

  if (type === 'dateOnly') {
    return format(date, 'MMM dd, yyyy');
  }

  try {
    return formatRelative(date, new Date());
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

function SchoolVisitFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = "RED_CAMPAIGN_ID"; // Hardcoded for now
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schoolVisitSchema),
    defaultValues: {
        dateOfVisit: format(new Date(), 'yyyy-MM-dd')
    }
  });

  if (!programId) {
      return (
          
              
                  
                   Program ID is missing. Please return to the MEAL hub and select the form again.
                   
                      Back to MEAL Hub
                  
              
          
      )
  }

  const onSubmit = async (data: VisitFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a report.' });
      return;
    }

    const visitData = {
      ...data,
      programId,
      userId: user.uid,
      userName: profile.name,
      createdAt: serverTimestamp() as Timestamp,
    };
    
    await addDocumentNonBlocking(collection(firestore, 'school-visits'), visitData)
        .then(() => {
            toast({ title: "Visit Report Saved!", description: `The report for ${data.schoolName} has been logged.` });
            router.push('/meal');
        })
        .catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the visit report.' });
        });
  };

  return (
    

        
            
                
                    
                         RED Campaign School Visit M&E
                        Log observations and feedback from a school visit.
                    
                
            
        

            
                 School Name
                
                {errors.schoolName && 
                 Date of Visit
                
                {errors.dateOfVisit && 
                 Objectives Met
                
                {errors.objectivesMet && 
                 Challenges Observed
                
            
            
                 Teacher Feedback
                
            
            
                 Student Feedback
                
            
            

            
                 Save Visit Report
                
            
          
        
    
  );
}

function TreeSurveyFormComponent() {
  const router = useRouter();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();

    const activitiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'activities'), orderBy('loggedAt', 'desc'));
    }, [firestore]);
    const { data: activities, isLoading } = useCollection(activitiesQuery);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(treeSurveySchema),
    defaultValues: {
        surveyDate: format(new Date(), 'yyyy-MM-dd'),
        conditionOfTrees: 'Good'
    }
  });

  const onSubmit = async (data: TreeSurveyFormData) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a report.' });
      return;
    }

    const surveyData = {
      ...data,
      userId: user.uid,
      userName: profile.name,
      createdAt: serverTimestamp() as Timestamp,
    };
    
    await addDocumentNonBlocking(collection(firestore, 'tree-surveys'), surveyData)
        .then(() => {
            toast({ title: "Survey Logged!", description: formatSafe(act.loggedAt, 'dateOnly')})
                                    
                                
                            )}
                        
                    )}
                    {errors.originalPlantingActivityId && 
                     Date of Survey
                
                {errors.surveyDate && 
                 Number of Trees Survived
                
                {errors.numberOfTreesSurvived && 
                 Condition of Trees
                
                  
                    
                        Good
                        Fair
                        Poor
                    
                  
                
                {errors.conditionOfTrees && 
                 Additional Notes
                
                Some trees affected by drought, others are thriving. Local community has been watering them...
                
            
            
                
                     Save Survey Data
                
            
          
        
    
  );
}

export default function TreeSurveyPage() {
    return (
        
            
        
    )
}

    