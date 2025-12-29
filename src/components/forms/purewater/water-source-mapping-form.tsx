
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, Map } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const waterSourceSchema = z.object({
  sourceName: z.string().min(3, 'Source name is required.'),
  type: z.enum(['Borehole', 'Spring', 'Tap', 'Rainwater']),
  gpsCoordinates: z.string().optional(),
  functional: z.boolean().default(true),
  photoUrl: z.string().url().optional(),
});

type WaterSourceFormData = z.infer<typeof waterSourceSchema>;

export function WaterSourceMappingForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WaterSourceFormData>({
    resolver: zodResolver(waterSourceSchema),
    defaultValues: {
      type: 'Borehole',
      functional: true,
    },
  });

  const onSubmit = async (data: WaterSourceFormData) => {
    if (!firestore) return;
    const formData = { ...data, createdAt: serverTimestamp() };
    try {
      await addDocumentNonBlocking(collection(firestore, 'water-sources'), formData);
      toast({
        title: 'Water Source Mapped!',
        description: `The ${data.sourceName} has been recorded.`,
      });
      reset();
      router.push('/meal/purewater');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to MEAL Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-6 w-6" />
            Water Source Mapping
          </CardTitle>
          <CardDescription>
            Log the location and status of a community water source.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sourceName">Source Name/Identifier</Label>
              <Input id="sourceName" {...register('sourceName')} placeholder="e.g., Ggaba Community Borehole" />
              {errors.sourceName && <p className="text-sm text-destructive">{errors.sourceName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Source Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Borehole">Borehole</SelectItem>
                      <SelectItem value="Spring">Protected Spring</SelectItem>
                      <SelectItem value="Tap">Public Tap</SelectItem>
                      <SelectItem value="Rainwater">Rainwater Harvesting</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="gpsCoordinates">GPS Coordinates (Optional)</Label>
              <Input id="gpsCoordinates" {...register('gpsCoordinates')} placeholder="e.g., 0.2678, 32.6145" />
            </div>
            <div className="flex items-center space-x-2">
                <Controller
                    name="functional"
                    control={control}
                    render={({ field }) => (
                        <Checkbox id="functional" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                />
              <Label htmlFor="functional">Is the source currently functional?</Label>
            </div>
             <div className="space-y-2">
              <Label htmlFor="photoUrl">Photo URL (Optional)</Label>
              <Input id="photoUrl" {...register('photoUrl')} placeholder="Link to a photo of the source"/>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Water Source
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
