
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DialogFooter } from '@/components/ui/dialog';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { EnterpriseFormTips } from './enterprise-form-tips';

const inventoryCheckSchema = z.object({
  productId: z.string().min(1, "Please select a product."),
  date: z.string().min(1, 'Date is required.'),
  countedQuantity: z.coerce.number().min(0, 'Count must be zero or more.'),
  notes: z.string().optional(),
});

type InventoryCheckFormData = z.infer<typeof inventoryCheckSchema>;

export function InventoryCheckForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const hasProducts = (products?.length || 0) > 0;

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
    },
  });

  const onSubmit = async (data: InventoryCheckFormData) => {
    if (!firestore || !profile) return;

    const product = products?.find(p => p.id === data.productId);
    if (!product) {
      toast({ variant: 'destructive', title: 'Product not found' });
      return;
    }

    const batch = writeBatch(firestore);

    // 1. Create inventory check record
    const checkRef = doc(collection(firestore, 'inventory-checks'));
    batch.set(checkRef, {
      ...data,
      productName: product.name,
      checkedBy: profile.name,
      createdAt: serverTimestamp(),
    });
    
    // 2. Update product stock level
    const productRef = doc(firestore, 'products', data.productId);
    const stockFieldToUpdate = product.type === 'finished' ? 'quantity_on_hand' : 'current_stock_quantity';
    batch.update(productRef, { [stockFieldToUpdate]: data.countedQuantity });

    try {
        await batch.commit();
        const isOffline = !navigator.onLine;
        toast({ title: 'Inventory Updated!', description: isOffline ? 'Saved locally. Will sync when back online.' : `Stock for ${product.name} has been set to ${data.countedQuantity}.` });
        reset();
    } catch (e: any) {
        const isOffline = !navigator.onLine;
        if (isOffline && (e.code === 'unavailable' || e.message?.includes('offline'))) {
          toast({ title: 'Saved Offline', description: 'Inventory check will sync when back online.' });
          reset();
        } else {
          toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not update inventory.' });
        }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      <EnterpriseFormTips type="inventory" />
      <div className="space-y-2">
        <Label htmlFor="productId">Product</Label>
        {isLoadingProducts ? <Skeleton className="h-10 sm:h-11" /> : (
            <Controller
            name="productId"
            control={control}
            render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="productId" className="h-10 sm:h-11"><SelectValue placeholder="Select a product..." /></SelectTrigger>
                    <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>)}</SelectContent>
                </Select>
            )}
            />
        )}
        {!isLoadingProducts && !hasProducts && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
            No products available for stock checks. Add items in{' '}
            <Link href="/enterprise/essentials/products" className="underline">Products</Link>.
          </div>
        )}
        {errors.productId && <p className="text-xs sm:text-sm text-destructive">{errors.productId.message}</p>}
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="space-y-2">
            <Label htmlFor="countedQuantity">Physical Count</Label>
            <Input id="countedQuantity" type="number" {...register('countedQuantity')} className="h-10 sm:h-11" />
            {errors.countedQuantity && <p className="text-xs sm:text-sm text-destructive">{errors.countedQuantity.message}</p>}
          </div>
            <div className="space-y-2">
                <Label htmlFor="date">Date of Count</Label>
                <Input id="date" type="date" {...register('date')} className="h-10 sm:h-11" />
                {errors.date && <p className="text-xs sm:text-sm text-destructive">{errors.date.message}</p>}
            </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Reason for discrepancy, etc.)</Label>
        <Textarea id="notes" {...register('notes')} className="min-h-[80px] sm:min-h-[100px]" />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting || !hasProducts} className="h-10 sm:h-11 w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Stock Count
        </Button>
      </DialogFooter>
    </form>
  );
}

    
