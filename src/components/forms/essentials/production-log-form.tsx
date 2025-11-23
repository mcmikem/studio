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
import { useFirestore, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, Package, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import Link from 'next/link';

const productionLogSchema = z.object({
  batchNumber: z.string().min(1, 'Batch number is required.'),
  product: z.enum(['Liquid Soap', 'Aloe Wash', 'Other'], {
    required_error: 'Please select a product.',
  }),
  date: z.string().min(1, 'Production date is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be greater than zero.'),
  materialsUsed: z.string().optional(),
  producedBy: z.string().min(2, 'Producer name is required.'),
});

type ProductionLogFormData = z.infer<typeof productionLogSchema>;

export function ProductionLogForm() {
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
  } = useForm<ProductionLogFormData>({
    resolver: zodResolver(productionLogSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      product: 'Liquid Soap',
      producedBy: profile?.name || '',
    },
  });

  const onSubmit = async (data: ProductionLogFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const logData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'essentials-production'), logData);
      toast({
        title: 'Production Logged!',
        description: `Batch ${data.batchNumber} has been added to the records.`,
      });
      reset();
      router.push('/essentials');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
       <Button variant="outline" asChild>
            <Link href="/essentials">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Essentials Hub
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Omuto Essentials Production Log
          </CardTitle>
          <CardDescription>
            Record a new batch of products made for the social enterprise.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number</Label>
                    <Input id="batchNumber" {...register('batchNumber')} />
                    {errors.batchNumber && <p className="text-sm text-destructive">{errors.batchNumber.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="date">Date of Production</Label>
                    <Input id="date" type="date" {...register('date')} />
                    {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                   <Controller
                    name="product"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="product">
                          <SelectValue placeholder="Select product..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Liquid Soap">Liquid Soap</SelectItem>
                          <SelectItem value="Aloe Wash">Aloe Wash</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.product && <p className="text-sm text-destructive">{errors.product.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity Produced (Liters/Units)</Label>
                    <Input id="quantity" type="number" {...register('quantity')} />
                    {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="producedBy">Produced By</Label>
                <Input id="producedBy" {...register('producedBy')} placeholder="Name of person or team" />
                {errors.producedBy && <p className="text-sm text-destructive">{errors.producedBy.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="materialsUsed">Raw Materials Used (Optional)</Label>
                <Textarea id="materialsUsed" {...register('materialsUsed')} placeholder="e.g., 5kg Caustic Soda, 2L Perfume..." />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Production Log
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
