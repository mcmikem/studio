
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
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

const ageGroups = ["U10", "U13", "U15", "U17", "U20"];
const trainingDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const equipment = ["Balls", "Bibs", "Boots", "Cones", "First Aid Kit"];

const teamRegistrationSchema = z.object({
  teamName: z.string().min(3, 'Team name is required.'),
  subcounty: z.string().min(3, 'Subcounty is required.'),
  parish: z.string().optional(),
  village: z.string().optional(),
  yearOfEstablishment: z.string().optional(),
  coachName: z.string().min(3, 'Coach name is required.'),
  coachPhone: z.string().min(10, 'A valid phone number is required.'),
  assistantCoach: z.string().optional(),
  patron: z.string().optional(),
  numberOfPlayers: z.coerce.number().min(1, 'Number of players is required.'),
  ageGroups: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one age group.",
  }),
  trainingGround: z.string().optional(),
  trainingDays: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one training day.",
  }),
  equipmentOwned: z.array(z.string()).optional(),
  challengesFaced: z.string().optional(),
  agreedToRules: z.boolean().refine(val => val === true, {
    message: 'You must agree to the OFA membership rules.',
  }),
});

type TeamRegistrationFormData = z.infer<typeof teamRegistrationSchema>;

export function OFATeamRegistrationForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TeamRegistrationFormData>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      ageGroups: [],
      trainingDays: [],
      equipmentOwned: [],
    }
  });

  const onSubmit = async (data: TeamRegistrationFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const formData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'ofa-teams'), formData);
      toast({
        title: 'Team Registered!',
        description: `${data.teamName} has been successfully registered for the OFA.`,
      });
      reset();
      router.push('/talents/ofa');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
       <Button variant="outline" asChild>
            <Link href="/talents/ofa">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to OFA Hub
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-6 w-6" />
            OFA Team Registration Form
          </CardTitle>
          <CardDescription>
            Official onboarding form for teams joining the Omuto Football Alliance.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input id="teamName" {...register('teamName')} />
              {errors.teamName && <p className="text-sm text-destructive">{errors.teamName.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="subcounty">Subcounty</Label>
                    <Input id="subcounty" {...register('subcounty')} />
                    {errors.subcounty && <p className="text-sm text-destructive">{errors.subcounty.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="parish">Parish</Label>
                    <Input id="parish" {...register('parish')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="village">Village/LC1</Label>
                    <Input id="village" {...register('village')} />
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="yearOfEstablishment">Year of Establishment</Label>
                <Input id="yearOfEstablishment" {...register('yearOfEstablishment')} />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="coachName">Coach Name</Label>
                    <Input id="coachName" {...register('coachName')} />
                    {errors.coachName && <p className="text-sm text-destructive">{errors.coachName.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="coachPhone">Coach Phone</Label>
                    <Input id="coachPhone" type="tel" {...register('coachPhone')} />
                     {errors.coachPhone && <p className="text-sm text-destructive">{errors.coachPhone.message}</p>}
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="assistantCoach">Assistant Coach (If any)</Label>
                    <Input id="assistantCoach" {...register('assistantCoach')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="patron">Patron/Sponsor</Label>
                    <Input id="patron" {...register('patron')} />
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="numberOfPlayers">Number of Players</Label>
                <Input id="numberOfPlayers" type="number" {...register('numberOfPlayers')} />
                {errors.numberOfPlayers && <p className="text-sm text-destructive">{errors.numberOfPlayers.message}</p>}
            </div>

            <div className="space-y-3">
              <Label>Age Groups Available</Label>
               <Controller
                name="ageGroups"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2">
                    {ageGroups.map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`age-${item}`}
                          checked={field.value?.includes(item)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, item])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== item
                                  )
                                )
                          }}
                        />
                        <Label htmlFor={`age-${item}`}>{item}</Label>
                      </div>
                    ))}
                  </div>
                )}
              />
              {errors.ageGroups && <p className="text-sm text-destructive">{errors.ageGroups.message}</p>}
            </div>

             <div className="space-y-2">
                <Label htmlFor="trainingGround">Training Ground</Label>
                <Input id="trainingGround" {...register('trainingGround')} />
            </div>

            <div className="space-y-3">
              <Label>Training Days</Label>
               <Controller
                name="trainingDays"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-4 gap-2">
                    {trainingDays.map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${item}`}
                          checked={field.value?.includes(item)}
                           onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, item])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== item
                                  )
                                )
                          }}
                        />
                        <Label htmlFor={`day-${item}`}>{item}</Label>
                      </div>
                    ))}
                  </div>
                )}
              />
              {errors.trainingDays && <p className="text-sm text-destructive">{errors.trainingDays.message}</p>}
            </div>

             <div className="space-y-3">
              <Label>Equipment Owned</Label>
              <Controller
                name="equipmentOwned"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2">
                    {equipment.map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`equip-${item}`}
                           checked={field.value?.includes(item)}
                           onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, item])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== item
                                  )
                                )
                          }}
                        />
                        <Label htmlFor={`equip-${item}`}>{item}</Label>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>

             <div className="space-y-2">
                <Label htmlFor="challengesFaced">Challenges Faced</Label>
                <Textarea id="challengesFaced" {...register('challengesFaced')} />
            </div>

             <div className="flex items-center space-x-2">
                <Controller
                    name="agreedToRules"
                    control={control}
                    render={({ field }) => (
                        <Checkbox id="agreedToRules" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                />
                <Label htmlFor="agreedToRules">Agree to OFA membership rules?</Label>
            </div>
             {errors.agreedToRules && <p className="text-sm text-destructive">{errors.agreedToRules.message}</p>}
            
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
