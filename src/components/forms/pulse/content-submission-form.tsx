'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, Wind, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import Link from 'next/link';

const pulseContentSchema = z.object({
  creatorName: z.string().min(2, 'Creator name is required.'),
  contentTitle: z.string().min(5, 'Content title is required.'),
  format: z.enum(['Video', 'Podcast', 'Article', 'Photo']),
  link: z.string().url('A valid URL to the content is required.'),
  description: z.string().optional(),
  dateCreated: z.string().min(1, 'Creation date is required.'),
});

type PulseContentFormData = z.infer<typeof pulseContentSchema>;

export function ContentSubmissionForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const { profile } = useUserProfile(user);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PulseContentFormData>({
    resolver: zodResolver(pulseContentSchema),
    defaultValues: {
      creatorName: profile?.name || '',
      dateCreated: format(new Date(), 'yyyy-MM-dd'),
      format: 'Article',
    },
  });

  const onSubmit = async (data: PulseContentFormData) => {
    if (!firestore) return;

    const contentData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'pulse-content'), contentData);
      toast({
        title: 'Content Submitted!',
        description: `Your submission "${data.contentTitle}" has been received.`,
      });
      reset();
      router.push('/forms');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
       <Button variant="outline" asChild className="rounded-xl">
            <Link href="/forms">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Forms Hub
            </Link>
        </Button>
      <Card className="border shadow-comic-sm w-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-card border shadow-comic-sm rounded-xl sm:rounded-2xl flex-shrink-0">
              <Wind className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy truncate">
                Pulse <span className="text-omuto-red">Content</span>
              </CardTitle>
              <CardDescription className="font-bold text-omuto-navy/50 text-[9px] sm:text-[10px] uppercase tracking-wider mt-1 sm:mt-2">
                Media Submission Terminal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
                <Label htmlFor="contentTitle">Content Title</Label>
                <Input id="contentTitle" {...register('contentTitle')} className="h-10 sm:h-11" />
                {errors.contentTitle && <p className="text-xs sm:text-sm text-destructive">{errors.contentTitle.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="creatorName">Creator Name</Label>
                <Input id="creatorName" {...register('creatorName')} className="h-10 sm:h-11" />
                {errors.creatorName && <p className="text-xs sm:text-sm text-destructive">{errors.creatorName.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                   <Controller
                     name="format"
                     control={control}
                     render={({ field }) => (
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <SelectTrigger id="format" className="h-10 sm:h-11"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Video">Video</SelectItem>
                           <SelectItem value="Podcast">Podcast</SelectItem>
                           <SelectItem value="Article">Article</SelectItem>
                            <SelectItem value="Photo">Photo</SelectItem>
                         </SelectContent>
                       </Select>
                     )}
                   />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dateCreated">Date Created</Label>
                    <Input id="dateCreated" type="date" {...register('dateCreated')} className="h-10 sm:h-11" />
                    {errors.dateCreated && <p className="text-xs sm:text-sm text-destructive">{errors.dateCreated.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="link">Link to Content (URL)</Label>
                <Input id="link" {...register('link')} placeholder="e.g., https://youtube.com/watch?v=..." className="h-10 sm:h-11" />
                {errors.link && <p className="text-xs sm:text-sm text-destructive">{errors.link.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Brief Description (Optional)</Label>
                <Textarea id="description" {...register('description')} className="min-h-[80px] sm:min-h-[100px]" />
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Content
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
