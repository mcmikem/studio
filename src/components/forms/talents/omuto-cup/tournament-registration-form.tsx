
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const tournamentRegistrationSchema = z.object({
  teamName: z.string().min(3, 'Team name is required.'),
  category: z.string().min(2, 'Category is required (e.g., U-14 Boys).'),
  contact: z.string().min(10, 'A valid contact number is required.'),
});

type TournamentRegistrationFormData = z.infer<typeof tournamentRegistrationSchema>;

export function TournamentRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TournamentRegistrationFormData>({
    resolver: zodResolver(tournamentRegistrationSchema),
  });

  const onSubmit = async (data: TournamentRegistrationFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const registrationData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-tournaments'), registrationData);
      toast({
        title: 'Team Registered!',
        description: `Team ${data.teamName} has been registered for the tournament.`,
      });
      reset();
      router.push('/talents/omuto-cup');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
       <Button variant="outline" asChild>
            <Link href="/talents/omuto-cup">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Omuto Cup Hub
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-6 w-6" />
            Omuto Cup Tournament Registration
          </CardTitle>
          <CardDescription>
            Register a new team for the Omuto Cup tournament.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input id="teamName" {...register('teamName')} />
                {errors.teamName && <p className="text-sm text-destructive">{errors.teamName.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...register('category')} placeholder="e.g., U-14 Boys, Senior Women" />
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="contact">Contact Phone Number</Label>
                <Input id="contact" type="tel" {...register('contact')} />
                {errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Team
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
