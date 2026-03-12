'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  runTransaction,
  query,
  where,
} from 'firebase/firestore';

import { Loader2, Package, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { EnterpriseFormTips } from './enterprise-form-tips';

// Local schema & types for production batches
const ProductionBatchFormSchema = z.object({
  id: z.string().optional(),
  batch_number: z.string().min(1, 'Batch number is required'),
  productId: z.string().min(1, 'Product is required'),
  quantity_produced: z.number().min(0, 'Quantity must be >= 0'),
  production_date: z.string(),
  status: z.string(),
  supervisorId: z.string().optional(),
  notes: z.string().optional(),
  materials_used: z.array(z.any()).optional(),
});

type ProductionBatchFormData = z.infer<typeof ProductionBatchFormSchema>;

type Product = {
  id: string;
  name: string;
  type: 'finished' | 'raw' | 'packaging';
  unit?: string;
};

export function ProductionBatchForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('type', '==', 'finished'));
  }, [firestore]);

  const { data: products, isLoading: isLoadingProducts } =
    useCollection<Product>(productsQuery);
  const hasProducts = (products?.length || 0) > 0;

  const form = useForm<ProductionBatchFormData>({
    resolver: zodResolver(ProductionBatchFormSchema),
    defaultValues: {
      batch_number: '',
      productId: '',
      quantity_produced: 0,
      production_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'in-progress',
      supervisorId: '',
      notes: '',
      materials_used: [],
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const [editingBatch, setEditingBatch] =
    useState<ProductionBatchFormData | null>(null);

  const handleEditBatch = (batch: ProductionBatchFormData) => {
    setEditingBatch(batch);
    reset({
      batch_number: batch.batch_number,
      productId: batch.productId,
      quantity_produced: batch.quantity_produced,
      production_date: batch.production_date,
      status: batch.status,
      supervisorId: profile?.id || '',
      notes: batch.notes || '',
      materials_used: batch.materials_used || [],
    });
  };

  const handleDeleteBatch = async (batch: ProductionBatchFormData) => {
    if (!firestore || !batch.id) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        const batchRef = doc(
          firestore,
          'production-batches',
          batch.id as string,
        );
        transaction.delete(batchRef);
      });

      toast({
        title: 'Batch Deleted',
        description: `${batch.batch_number} has been deleted.`,
      });

      if (editingBatch?.id === batch.id) {
        setEditingBatch(null);
        reset({
          production_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'in-progress',
          supervisorId: profile?.id || '',
          materials_used: [],
          batch_number: '',
          productId: '',
          quantity_produced: 0,
          notes: '',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error?.message || 'Could not delete batch.',
      });
    }
  };

  const onSubmit = async (data: ProductionBatchFormData) => {
    if (!firestore || !user || !profile) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        if (editingBatch && editingBatch.id) {
          const batchRef = doc(
            firestore,
            'production-batches',
            editingBatch.id as string,
          );
          transaction.update(batchRef, {
            ...data,
            updatedBy: profile.name,
            updatedAt: serverTimestamp(),
          });
        } else {
          const batchRef = doc(collection(firestore, 'production-batches'));
          transaction.set(batchRef, {
            ...data,
            logged_by: profile.name,
            createdAt: serverTimestamp(),
          });
        }
      });

      toast({
        title: editingBatch ? 'Batch Updated' : 'Batch Created',
        description: editingBatch
          ? `${data.batch_number} has been updated.`
          : `${data.batch_number} has been created.`,
      });

      setEditingBatch(null);
      reset({
        batch_number: '',
        productId: '',
        quantity_produced: 0,
        production_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'in-progress',
        supervisorId: profile?.id || '',
        notes: '',
        materials_used: [],
      });

      router.push('/enterprise/essentials');
    } catch (e: any) {
      console.error('Batch save failed:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save production batch.',
      });
    }
  };

  return (
    <div className="enterprise-form-shell">
      <EnterpriseFormTips type="production" />
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-black uppercase tracking-tighter">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Production Batch
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
            Record production batches to track finished goods and materials used.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">
                  Select Product
                </Label>
                {isLoadingProducts ? (
                  <Skeleton className="h-12 rounded-xl" />
                ) : (
                  <Select
                    onValueChange={(value) =>
                      reset({ ...watch(), productId: value })
                    }
                    value={watch('productId')}
                  >
                    <SelectTrigger className="h-12 border-lg rounded-xl font-bold">
                      <SelectValue placeholder="Which product?" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="font-bold">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {!isLoadingProducts && !hasProducts && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
                    No finished products available. Add products first in{' '}
                    <Link
                      href="/enterprise/essentials/products"
                      className="underline"
                    >
                      Products
                    </Link>
                    .
                  </div>
                )}
                {errors.productId && (
                  <p className="text-xs text-destructive font-bold">
                    {errors.productId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">
                  Production Date
                </Label>
                <Input
                  type="date"
                  {...register('production_date')}
                  className="border-lg rounded-xl h-12 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-dashed">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">
                  Batch Number
                </Label>
                <Input
                  {...register('batch_number')}
                  className="border-lg rounded-xl h-12 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">
                  Quantity Produced
                </Label>
                <Input
                  type="number"
                  {...register('quantity_produced', { valueAsNumber: true })}
                  className="border-lg rounded-xl h-12 font-bold text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">
                  Status
                </Label>
                <Input
                  {...register('status')}
                  className="border-lg rounded-xl h-12 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-dashed">
              <Label className="font-bold text-xs uppercase tracking-widest">
                Notes (Optional)
              </Label>
              <Input
                {...register('notes')}
                placeholder="e.g., Shift A, minor machine downtime"
                className="border-lg rounded-xl h-12 font-bold"
              />
            </div>
          </CardContent>
          <CardFooter className="enterprise-form-footer">
            <Button
              type="submit"
              disabled={isSubmitting || !hasProducts}
              className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {editingBatch ? 'Update Batch' : 'Save Production Batch'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default ProductionBatchForm;
