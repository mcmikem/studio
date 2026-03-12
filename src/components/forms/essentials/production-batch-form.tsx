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
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, runTransaction, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Loader2, ArrowLeft, Package, PlusCircle, Trash2, Wand2, Boxes, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useMemo, useState } from 'react';
import { EnterpriseFormTips } from './enterprise-form-tips';

type ProductionBatchRecord = {
  id: string;
  batch_number: string;
  production_date: string;
  quantity_produced: number;
  status: 'planned' | 'in-progress' | 'completed';
  productId: string;
  notes?: string;
  materials_used?: { material_id: string; quantity_used: number }[];
  material_cost_total?: number;
  linkedExpenseId?: string;
};

export function ProductionBatchForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductionBatchRecord | null>(null);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const recentBatchesQuery = useMemoFirebase((db) => {
    if (!db) return null;
    return query(collection(db, 'production-batches'), orderBy('createdAt', 'desc'), limit(6));
  }, [firestore]);
  const { data: recentBatches, isLoading: isLoadingBatches } = useCollection<ProductionBatchRecord>(recentBatchesQuery);

  const finishedGoods = useMemo(() => products?.filter(p => p.type === 'finished') || [], [products]);
  const materials = useMemo(() => products?.filter(p => p.type === 'raw' || p.type === 'packaging') || [], [products]);

  const form = useForm<ProductionBatchFormData>({
    resolver: zodResolver(ProductionBatchFormSchema),
    defaultValues: {
      production_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'in-progress',
      supervisorId: profile?.id || '',
      materials_used: []
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = form;
  
  useEffect(() => {
    if (profile?.id) {
        setValue('supervisorId', profile.id);
    }
  }, [profile, setValue]);

  const productionDate = watch('production_date');

  const generateBatchNumber = async (dateString?: string, shouldToast = true) => {
      if (!firestore) return;
      setIsGeneratingBatch(true);
      try {
          const normalizedDate = dateString || getValues('production_date') || format(new Date(), 'yyyy-MM-dd');
          const q = query(collection(firestore, 'production-batches'), where('production_date', '==', normalizedDate));
          const snapshot = await getDocs(q);
          const count = snapshot.size + 1;
          const batchNum = `PROD-${normalizedDate.replaceAll('-', '').slice(2)}-${count.toString().padStart(3, '0')}`;
          setValue('batch_number', batchNum);
          if (shouldToast) {
            toast({ title: "Batch Number Generated", description: batchNum });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingBatch(false);
      }
  };

  useEffect(() => {
    if (!editingBatch && productionDate && !getValues('batch_number')) {
      generateBatchNumber(productionDate, false);
    }
  }, [productionDate, editingBatch]);
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "materials_used"
  });

  const hasFinishedGoods = finishedGoods.length > 0;

  const handleEditBatch = (batch: ProductionBatchRecord) => {
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

  const handleDeleteBatch = async (batch: ProductionBatchRecord) => {
    if (!firestore) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, 'production-batches', batch.id));
      toast({ title: 'Batch Deleted', description: `${batch.batch_number} has been deleted.` });
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
      toast({ variant: 'destructive', title: 'Delete Failed', description: error?.message || 'Could not delete batch.' });
    }
  };

  const onSubmit = async (data: ProductionBatchFormData) => {
    if (!firestore || !profile) return;
    if (!hasFinishedGoods) {
      toast({
        variant: 'destructive',
        title: 'No Finished Products Available',
        description: 'Please create at least one finished product before logging a batch.'
      });
      return;
    }
    
    try {
        if (editingBatch) {
            const materialCostItems = (data.materials_used || []).map((item) => {
              const materialProduct = materials.find((m) => m.id === item.material_id);
              const unitCost = Number(materialProduct?.cost_per_unit || 0);
              return {
                description: `${materialProduct?.name || 'Material'} (${item.quantity_used} ${materialProduct?.unit || 'units'})`,
                category: 'Raw Materials' as const,
                amount: Math.max(0, item.quantity_used * unitCost),
              };
            }).filter((item) => item.amount > 0);

            const materialCostTotal = materialCostItems.reduce((sum, item) => sum + item.amount, 0);

            await updateDocumentNonBlocking(doc(firestore, 'production-batches', editingBatch.id), {
                ...data,
                material_cost_total: materialCostTotal,
                updatedAt: serverTimestamp(),
            });

            if (editingBatch.linkedExpenseId) {
              await updateDocumentNonBlocking(doc(firestore, 'expenses', editingBatch.linkedExpenseId), {
                date: data.production_date,
                items: materialCostItems,
                totalAmount: materialCostTotal,
                title: `Production Batch ${data.batch_number}`,
                updatedAt: serverTimestamp(),
              });
            }

            toast({ title: 'Batch Updated', description: `${data.batch_number} updated successfully.` });
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
            return;
        }

        await runTransaction(firestore, async (transaction) => {
            // 1. Create Production Batch document
            const batchRef = doc(collection(firestore, 'production-batches'));
            const expenseRef = doc(collection(firestore, 'expenses'));
            const materialExpenseItems: Array<{ description: string; category: 'Raw Materials'; amount: number }> = [];
            let materialCostTotal = 0;
            const newBatchData = {
                ...data,
                supervisorId: profile.id,
                material_cost_total: 0,
                createdAt: serverTimestamp(),
            };
            

            // 2. Decrement raw material stock
            if (data.materials_used && data.materials_used.length > 0) {
                for (const material of data.materials_used) {
                    const materialDocRef = doc(firestore, 'products', material.material_id);
                    const materialDoc = await transaction.get(materialDocRef);
                    if (!materialDoc.exists()) {
                        throw new Error(`Material with ID ${material.material_id} not found.`);
                    }
                    const currentStock = materialDoc.data().current_stock_quantity || 0;
                    const newStock = currentStock - material.quantity_used;
                    const unitCost = Number(materialDoc.data().cost_per_unit || 0);
                    const itemCost = material.quantity_used * unitCost;
                    materialCostTotal += itemCost;
                    materialExpenseItems.push({
                      description: `${materialDoc.data().name} (${material.quantity_used} ${materialDoc.data().unit || 'units'})`,
                      category: 'Raw Materials',
                      amount: itemCost,
                    });
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

            transaction.set(batchRef, {
                ...newBatchData,
                material_cost_total: materialCostTotal,
                linkedExpenseId: materialExpenseItems.length > 0 ? expenseRef.id : null,
            });

            if (materialExpenseItems.length > 0) {
              transaction.set(expenseRef, {
                userId: profile.id,
                userName: profile.name,
                submittedFor: profile.id,
                date: data.production_date,
                title: `Production Batch ${data.batch_number}`,
                type: 'Reimbursement',
                items: materialExpenseItems,
                totalAmount: materialCostTotal,
                status: 'Pending',
                createdAt: serverTimestamp(),
                projectId: 'enterprise-essentials',
                projectName: 'Omuto Essentials Production',
                batchId: batchRef.id,
              });
            }
        });

        toast({ title: 'Production Batch Logged!', description: `Batch #${data.batch_number} has been recorded and inventory updated.` });
        router.push('/enterprise/essentials');

    } catch (e: any) {
        console.error("Production log transaction failed: ", e);
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not log production batch.'});
    }
  };

  return (
     <div className="enterprise-form-shell">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href="/enterprise/essentials">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Hub
        </Link>
      </Button>
      <EnterpriseFormTips type="production" />
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter"><Package className="h-8 w-8 text-primary"/> New Production Batch</CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Log a manufacturing run to update your finished goods and raw material inventory.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <Label htmlFor="batch_number" className="font-bold text-xs uppercase tracking-widest">Batch Number</Label>
                  <div className="flex gap-2">
                    <Input id="batch_number" {...register('batch_number')} placeholder="e.g., PROD-240520-001" className="font-mono border-lg rounded-xl h-12" />
                    <Button type="button" variant="outline" size="icon" className="h-12 w-12 border-lg rounded-xl" onClick={() => generateBatchNumber(productionDate)} disabled={isGeneratingBatch}>
                        {isGeneratingBatch ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4 text-primary"/>}
                    </Button>
                  </div>
                  {errors.batch_number && <p className="text-xs text-destructive font-bold">{errors.batch_number.message}</p>}
              </div>
              <div className="space-y-2">
                  <Label htmlFor="production_date" className="font-bold text-xs uppercase tracking-widest">Production Date</Label>
                  <Input id="production_date" type="date" {...register('production_date')} className="border-lg rounded-xl h-12" />
                  {errors.production_date && <p className="text-xs text-destructive font-bold">{errors.production_date.message}</p>}
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
               <div className="space-y-2">
                 <Label className="font-bold text-xs uppercase tracking-widest">Finished Product</Label>
                 {isLoadingProducts ? <Skeleton className="h-12 rounded-xl" /> : (
                    <Controller name="productId" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-12 border-lg rounded-xl font-bold"><SelectValue placeholder="Select product..." /></SelectTrigger><SelectContent>{finishedGoods.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>)}</SelectContent></Select>
                    )}/>
                 )}
                  {!isLoadingProducts && !hasFinishedGoods && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
                      No finished products found. Create one first in{' '}
                      <Link href="/enterprise/essentials/products" className="underline">Products</Link>.
                    </div>
                  )}
                  {errors.productId && <p className="text-xs text-destructive font-bold">{errors.productId.message}</p>}
               </div>
                <div className="space-y-2">
                    <Label htmlFor="quantity_produced" className="font-bold text-xs uppercase tracking-widest">Quantity Produced</Label>
                    <Input id="quantity_produced" type="number" {...register('quantity_produced')} className="border-lg rounded-xl h-12 font-bold text-lg" />
                    {errors.quantity_produced && <p className="text-xs text-destructive font-bold">{errors.quantity_produced.message}</p>}
                </div>
            </div>

             <div className="space-y-4 pt-6 border-t border-dashed">
                <h3 className="font-black uppercase text-xs tracking-widest text-muted-foreground flex items-center gap-2"><Boxes className="h-4 w-4"/> Materials & Packaging Consumption</h3>
                {!isLoadingProducts && materials.length === 0 && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    No raw/packaging materials configured yet. You can still log the batch now and add materials later from inventory records.
                  </div>
                )}
                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-3 items-end p-4 bg-muted/20 border-lg rounded-2xl relative">
                            <div className="col-span-12 md:col-span-7 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Material Name</Label>
                                {isLoadingProducts ? <Skeleton className="h-10 rounded-xl"/> : (
                                    <Controller name={`materials_used.${index}.material_id`} control={control} render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-11 border-lg rounded-xl font-bold bg-white"><SelectValue placeholder="Select raw material..." /></SelectTrigger><SelectContent>{materials.map(m => <SelectItem key={m.id} value={m.id} className="font-bold">{m.name} ({m.unit})</SelectItem>)}</SelectContent></Select>
                                    )}/>
                                )}
                            </div>
                            <div className="col-span-10 md:col-span-4 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantity Used</Label>
                                <Input type="number" step="0.01" {...register(`materials_used.${index}.quantity_used`)} className="h-11 border-lg rounded-xl font-bold bg-white" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Button type="button" variant="ghost" size="icon" className="h-11 w-11 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl" onClick={() => remove(index)}>
                                    <Trash2 className="h-5 w-5"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ material_id: '', quantity_used: 0 })} className="font-black text-xs uppercase tracking-widest border-lg rounded-xl h-10 px-4">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Material Item
                </Button>
            </div>

             <div className="space-y-2 pt-4 border-t border-dashed">
                <Label htmlFor="notes" className="font-bold text-xs uppercase tracking-widest">Production Notes</Label>
                <Textarea id="notes" {...register('notes')} placeholder="e.g., Temperature conditions, team members involved, or any deviations from SOP..." className="border-lg rounded-xl min-h-[100px]" />
             </div>
          </CardContent>
          <CardFooter className="enterprise-form-footer">
            <Button type="submit" disabled={isSubmitting || !hasFinishedGoods} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Package className="mr-2 h-5 w-5" />}
              {editingBatch ? 'Save Batch Changes' : 'Commit Production Batch to Inventory'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="border-lg shadow-comic-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Production Batches</CardTitle>
          <CardDescription>Edit or delete batch records. Editing updates linked expense details but does not auto-reverse stock movements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingBatches && <Skeleton className="h-20 w-full rounded-xl" />}
          {!isLoadingBatches && (!recentBatches || recentBatches.length === 0) && (
            <p className="text-sm text-muted-foreground">No batches logged yet.</p>
          )}
          {recentBatches?.map((batch) => (
            <div key={batch.id} className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-bold">{batch.batch_number}</p>
                <p className="text-xs text-muted-foreground">{batch.production_date} • Qty {batch.quantity_produced} • Cost {batch.material_cost_total ? batch.material_cost_total.toLocaleString() : 0} UGX</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => handleEditBatch(batch)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => handleDeleteBatch(batch)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
