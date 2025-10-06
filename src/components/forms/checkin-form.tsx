'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';

const missions = [
  { id: 'mission-1', label: '[OCT KR-3] Deliver RED Campaign session at Greenhill PTA' },
  { id: 'mission-2', label: '[OCT KR-2] Plant 50 trees with Kibibi SS Green Team' },
  { id: 'mission-3', label: '[WEEKLY] Finalize Dignity Pads branding with YoSkills grads' },
  { id: 'mission-other', label: 'Other...' },
];

const secondaryWins = [
    { id: 'win-1', label: 'Identify 2 parent champions for the RED campaign' },
    { id: 'win-2', label: 'Test Dignity Pads prototypes with 5 parents for feedback' },
    { id: 'win-3', label: 'Recruit 3 volunteers for the upcoming Football Gala' },
    { id: 'win-4', label: 'Capture 5 high-quality photos & 1 video for Omuto Pulse' },
];

const communityResources = [
    { id: 'resource-1', label: 'Use Campus Ambassador: John (Makerere) for setup' },
    { id: 'resource-2', label: 'Engage Local Volunteer: Sarah (Mpigi) for translation' },
];

const checkinSchema = z.object({
  primaryMission: z.string().min(1, 'You must select a primary mission.'),
  secondaryWins: z.array(z.string()).optional(),
  communityResources: z.array(z.string()).optional(),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

export function CheckinForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      secondaryWins: [],
      communityResources: [],
    }
  });

  const onSubmit = (data: CheckinFormData) => {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to submit a check-in.",
        });
        return;
    }

    const checkinData = {
        ...data,
        userId: user.uid,
        name: user.displayName || user.email,
        timestamp: serverTimestamp(),
    };

    const checkinsCollection = collection(firestore, 'checkins');
    addDocumentNonBlocking(checkinsCollection, checkinData);

    toast({
      title: 'Checked In!',
      description: "Your daily mission has been logged. Let's make an impact!",
    });
    reset();
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Plan Your Day for Maximum Impact</CardTitle>
          <CardDescription>
            Align your daily tasks with our strategic goals. This is the first
            step to a productive day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="primary-mission" className="text-base font-semibold">
              What's Your Primary Mission Today?
            </Label>
            <Controller
              name="primaryMission"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="primary-mission">
                    <SelectValue placeholder="Select a mission from the operational plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map(mission => (
                        <SelectItem key={mission.id} value={mission.label}>{mission.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
             {errors.primaryMission && (
              <p className="text-sm text-destructive">
                {errors.primaryMission.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">
              How Will You Create Multiple Wins?
            </Label>
            <p className="text-sm text-muted-foreground">
              Based on your selected mission, here are some suggested secondary
              wins.
            </p>
            <div className="space-y-3 rounded-md border p-4">
               <Controller
                name="secondaryWins"
                control={control}
                render={({ field }) => (
                    <>
                    {secondaryWins.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                            <Checkbox
                                id={item.id}
                                checked={field.value?.includes(item.label)}
                                onCheckedChange={(checked) => {
                                    return checked
                                    ? field.onChange([...(field.value || []), item.label])
                                    : field.onChange(field.value?.filter((value) => value !== item.label));
                                }}
                            />
                            <Label htmlFor={item.id} className="font-normal cursor-pointer">
                                {item.label}
                            </Label>
                        </div>
                    ))}
                    </>
                )}
                />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Community Resources to Leverage
            </Label>
            <p className="text-sm text-muted-foreground">
              Available team members and volunteers in your location.
            </p>
            <div className="space-y-3 rounded-md border p-4">
                <Controller
                name="communityResources"
                control={control}
                render={({ field }) => (
                    <>
                    {communityResources.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                            <Checkbox
                                id={item.id}
                                checked={field.value?.includes(item.label)}
                                onCheckedChange={(checked) => {
                                    return checked
                                    ? field.onChange([...(field.value || []), item.label])
                                    : field.onChange(field.value?.filter((value) => value !== item.label));
                                }}
                            />
                            <Label htmlFor={item.id} className="font-normal cursor-pointer">
                                {item.label}
                            </Label>
                        </div>
                    ))}
                    </>
                )}
                />
            </div>
          </div>

          <Button size="lg" className="w-full" type="submit" disabled={isSubmitting}>
             {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}
            Check In & Start Mission
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
