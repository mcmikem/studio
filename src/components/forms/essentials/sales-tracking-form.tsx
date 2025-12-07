
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, DollarSign, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import Link from 'next/link';
import { useMemo, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

const salesTrackingSchema = z.object({
  date: z.string().min(1, 'Date is required.'),
  salesAgent: z.string().min(2, 'Sales agent name is required.'),
  product: z.enum(['Liquid Soap', 'Aloe Wash', 'Other'], {
    required_error: 'Please select a product.',
  }),
  quantity: z.coerce.number().min(0.1, 'Quantity must be greater than zero.'),
  unitPrice: z.coerce.number().min(1, 'Unit price must be greater than zero.'),
  totalAmount: z.coerce.number(),
  paymentMethod: z.enum(['Cash', 'Mobile Money']),
});

type SalesTrackingFormData = z.infer<typeof salesTrackingSchema>;

export function SalesTrackingForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const { profile } = useUserProfile(user);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SalesTrackingFormData>({
    resolver: zodResolver(salesTrackingSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      product: 'Liquid Soap',
      paymentMethod: 'Cash',
      quantity: 1,
      unitPrice: 5000,
    },
  });
  
  useEffect(() => {
    if (profile) {
      setValue('salesAgent', profile.name);
    }
  }, [profile, setValue]);

  const quantity = watch('quantity');
  const unitPrice = watch('unitPrice');
  
  const totalAmount = useMemo(() => {
    return (quantity || 0) * (unitPrice || 0);
  }, [quantity, unitPrice]);

  useEffect(() => {
    setValue('totalAmount', totalAmount);
  }, [totalAmount, setValue]);

  const onSubmit = async (data: SalesTrackingFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    const logData = { ...data, createdAt: serverTimestamp() };

    try {
      await addDocumentNonBlocking(collection(firestore, 'essentials-sales'), logData);
      toast({
        title: 'Sale Logged!',
        description: `Sale of ${data.quantity} ${data.product}(s) has been recorded.`,
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
            <DollarSign className="h-6 w-6" />
            Omuto Essentials Sales Tracking
          </CardTitle>
          <CardDescription>
            Record a new sale of products to a customer or outlet.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Date of Sale</Label>
                    <Input id="date" type="date" {...register('date')} />
                    {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="salesAgent">Sales Agent/Outlet</Label>
                    <Input id="salesAgent" {...register('salesAgent')} />
                    {errors.salesAgent && <p className="text-sm text-destructive">{errors.salesAgent.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
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
                    <Label htmlFor="quantity">Quantity (Liters/Units)</Label>
                    <Input id="quantity" type="number" {...register('quantity')} />
                    {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (UGX)</Label>
                    <Input id="unitPrice" type="number" {...register('unitPrice')} />
                    {errors.unitPrice && <p className="text-sm text-destructive">{errors.unitPrice.message}</p>}
                </div>
            </div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
                <span className="font-semibold">Total Amount</span>
                <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="space-y-2">
                <Label>Payment Method</Label>
                <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="Cash" />Cash</Label>
                            <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="Mobile Money" />Mobile Money</Label>
                        </RadioGroup>
                    )}
                />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Sale
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
