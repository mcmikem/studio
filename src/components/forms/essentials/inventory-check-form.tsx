
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
import { Loader2, List, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import Link from 'next/link';

const inventoryCheckSchema = z.object({
  date: z.string().min(1, 'Date is required.'),
  product: z.enum(['Liquid Soap', 'Aloe Wash', 'Other'], {
    required_error: 'Please select a product.',
  }),
  physicalCount: z.coerce.number().min(0, 'Physical count must be zero or more.'),
  discrepancyReason: z.string().optional(),
});

type InventoryCheckFormData = z.infer<typeof inventoryCheckSchema>;

export function InventoryCheckForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InventoryCheckFormData>({
    resolver: zodResolver(inventoryCheckSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      product: 'Liquid Soap',
    },
  });

  const onSubmit = async (data: InventoryCheckFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const logData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'essentials-inventory'), logData);
      toast({
        title: 'Inventory Logged!',
        description: `The stock count for ${data.product} has been recorded.`,
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
            <List className="h-6 w-6" />
            Omuto Essentials Inventory Check
          </CardTitle>
          <CardDescription>
            Perform a stock count of products to track inventory levels.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Date of Count</Label>
                    <Input id="date" type="date" {...register('date')} />
                    {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>
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
            </div>
             <div className="space-y-2">
                <Label htmlFor="physicalCount">Physical Count (Liters/Units)</Label>
                <Input id="physicalCount" type="number" {...register('physicalCount')} />
                {errors.physicalCount && <p className="text-sm text-destructive">{errors.physicalCount.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="discrepancyReason">Reason for Discrepancy (if any)</Label>
                <Textarea id="discrepancyReason" {...register('discrepancyReason')} placeholder="e.g., Damaged items, samples given out..." />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Inventory Count
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
