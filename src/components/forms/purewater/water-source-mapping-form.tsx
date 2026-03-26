
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
      <Button variant="outline" asChild className="rounded-xl">
        <Link href="/meal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to MEAL Hub
        </Link>
      </Button>
      <Card className="border shadow-comic-sm w-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white border shadow-comic-sm rounded-xl sm:rounded-2xl flex-shrink-0">
              <Map className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy truncate">
                Water <span className="text-omuto-red">Mapping</span>
              </CardTitle>
              <CardDescription className="font-bold text-omuto-navy/50 text-[9px] sm:text-[10px] uppercase tracking-wider mt-1 sm:mt-2">
                Source Location Terminal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="sourceName">Source Name/Identifier</Label>
              <Input id="sourceName" {...register('sourceName')} placeholder="e.g., Ggaba Community Borehole" className="h-10 sm:h-11" />
              {errors.sourceName && <p className="text-xs sm:text-sm text-destructive">{errors.sourceName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Source Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-10 sm:h-11"><SelectValue /></SelectTrigger>
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
              <Input id="gpsCoordinates" {...register('gpsCoordinates')} placeholder="e.g., 0.2678, 32.6145" className="h-10 sm:h-11" />
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
              <Input id="photoUrl" {...register('photoUrl')} placeholder="Link to a photo of the source" className="h-10 sm:h-11"/>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isSubmitting} className="w-full h-10 sm:h-11">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Water Source
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
