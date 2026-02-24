'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductionBatchFormSchema, type ProductionBatchFormData, type Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch, runTransaction } from 'firebase/firestore';
import { Loader2, ArrowLeft, Package, PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useMemo } from 'react';

export function ProductionBatchForm() {
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

  const finishedGoods = useMemo(() => products?.filter(p => p.type === 'finished') || [], [products]);
  const materials = useMemo(() => products?.filter(p => p.type === 'raw' || p.type === 'packaging') || [], [products]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductionBatchFormData>({
    resolver: zodResolver(ProductionBatchFormSchema),
    defaultValues: {
      production_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'in-progress',
      supervisorId: profile?.id || '',
      materials_used: [{ material_id: '', quantity_used: 0 }]
    },
  });
  
  useEffect(() => {
    if (profile?.id) {
        setValue('supervisorId', profile.id);
    }
  }, [profile, setValue]);
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "materials_used"
  });

  const onSubmit = async (data: ProductionBatchFormData) => {
    if (!firestore || !profile) return;
    
    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Create Production Batch document
            const batchRef = doc(collection(firestore, 'production-batches'));
            const newBatchData = {
                ...data,
                supervisorId: profile.id,
                createdAt: serverTimestamp(),
            };
            transaction.set(batchRef, newBatchData);

            // 2. Decrement raw material stock
            if (data.materials_used) {
                for (const material of data.materials_used) {
                    const materialDocRef = doc(firestore, 'products', material.material_id);
                    const materialDoc = await transaction.get(materialDocRef);
                    if (!materialDoc.exists()) {
                        throw new Error(`Material with ID ${material.material_id} not found.`);
                    }
                    const currentStock = materialDoc.data().current_stock_quantity || 0;
                    const newStock = currentStock - material.quantity_used;
                    if (newStock < 0) {
                        throw new Error(`Insufficient stock for ${materialDoc.data().name}.`);
                    }
                    transaction.update(materialDocRef, { current_stock_quantity: newStock });
                }
            }

            // 3. Increment finished good stock
            const productDocRef = doc(firestore, 'products', data.productId);
            const productDoc = await transaction.get(productDocRef);
             if (!productDoc.exists()) {
                throw new Error(`Product with ID ${data.productId} not found.`);
            }
            const currentStock = productDoc.data().quantity_on_hand || 0;
            const newStock = currentStock + data.quantity_produced;
            transaction.update(productDocRef, { quantity_on_hand: newStock });
        });

        toast({ title: 'Production Batch Logged!', description: `Batch #${data.batch_number} has been recorded and inventory updated.` });
        router.push('/enterprise/essentials');

    } catch (e: any) {
        console.error("Production log transaction failed: ", e);
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not log production batch.'});
    }
  };

  return (
     <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/enterprise/essentials">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Essentials Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6"/> New Production Batch</CardTitle>
          <CardDescription>Log a manufacturing run to update your finished goods and raw material inventory.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Batch Number</Label><Input {...register('batch_number')} />{errors.batch_number && <p className="text-sm text-destructive">{errors.batch_number.message}</p>}</div>
              <div className="space-y-2"><Label>Production Date</Label><Input type="date" {...register('production_date')} />{errors.production_date && <p className="text-sm text-destructive">{errors.production_date.message}</p>}</div>
            </div>
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Product Manufactured</Label>
                 {isLoadingProducts ? <Skeleton className="h-10" /> : (
                    <Controller name="productId" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select finished good..." /></SelectTrigger><SelectContent>{finishedGoods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    )}/>
                 )}
                  {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
               </div>
                <div className="space-y-2"><Label>Quantity Produced</Label><Input type="number" {...register('quantity_produced')} />{errors.quantity_produced && <p className="text-sm text-destructive">{errors.quantity_produced.message}</p>}</div>
            </div>
             <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Materials & Packaging Used</h3>
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md">
                        <div className="col-span-12 md:col-span-7 space-y-1"><Label>Material</Label>
                            {isLoadingProducts ? <Skeleton className="h-10"/> : (
                                <Controller name={`materials_used.${index}.material_id`} control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select material..." /></SelectTrigger><SelectContent>{materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}</SelectContent></Select>
                                )}/>
                            )}
                        </div>
                        <div className="col-span-8 md:col-span-4 space-y-1"><Label>Quantity Used</Label><Input type="number" {...register(`materials_used.${index}.quantity_used`)} /></div>
                        <div className="col-span-4 md:col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button></div>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ material_id: '', quantity_used: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Material</Button>
            </div>
             <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea {...register('notes')} />
             </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Production Batch
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}