'use client';

import { useMemo, useState } from 'react';
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
  orderBy,
} from 'firebase/firestore';

import { Loader2, Package, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { EnterpriseFormTips } from './enterprise-form-tips';
import { formatCurrency } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProductForm } from './product-form';

type MaterialUsage = {
  material_id: string;
  material_name: string;
  quantity_used: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
};

function generateBatchNumber() {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `BATCH-${date}-${random}`;
}

const ProductionBatchFormSchema = z.object({
  id: z.string().optional(),
  batch_number: z.string().min(1, 'Batch number is required'),
  productId: z.string().min(1, 'Product is required'),
  quantity_produced: z.number().min(0, 'Quantity must be >= 0'),
  production_date: z.string(),
  status: z.enum(['in-progress', 'completed', 'on-hold']),
  supervisorId: z.string().optional(),
  notes: z.string().optional(),
  materials_used: z.array(
    z.object({
      material_id: z.string().min(1, 'Material is required'),
      material_name: z.string(),
      quantity_used: z.number().min(0.01, 'Quantity must be greater than 0'),
      unit: z.string(),
      unit_cost: z.number(),
      total_cost: z.number(),
    }),
  ).optional(),
});

type ProductionBatchFormData = z.infer<typeof ProductionBatchFormSchema>;

type Product = {
  id: string;
  name: string;
  type: 'finished' | 'raw' | 'packaging';
  unit?: string;
  cost_per_unit?: number;
  quantity_on_hand?: number;
  current_stock_quantity?: number;
};

export function ProductionBatchForm() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('type', '==', 'finished'), orderBy('name'));
  }, [firestore]);

  const materialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('type', 'in', ['raw', 'packaging']), orderBy('name'));
  }, [firestore]);

  const batchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'production-batches'), orderBy('production_date', 'desc'));
  }, [firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const { data: materialProducts } = useCollection<Product>(materialsQuery);
  const { data: batches, isLoading: isLoadingBatches } = useCollection<ProductionBatchFormData>(batchesQuery);
  const hasProducts = (products?.length || 0) > 0;

  const form = useForm<ProductionBatchFormData>({
    resolver: zodResolver(ProductionBatchFormSchema),
    defaultValues: {
      batch_number: generateBatchNumber(),
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
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const [editingBatch, setEditingBatch] = useState<ProductionBatchFormData | null>(null);

  const materialsUsed = watch('materials_used') || [];
  const materialCostTotal = useMemo(
    () => materialsUsed.reduce((sum, item) => sum + Number(item.total_cost || 0), 0),
    [materialsUsed],
  );

  const addMaterialLine = () => {
    setValue('materials_used', [
      ...materialsUsed,
      {
        material_id: '',
        material_name: '',
        quantity_used: 1,
        unit: '',
        unit_cost: 0,
        total_cost: 0,
      },
    ]);
  };

  const updateMaterialLine = (index: number, partial: Partial<MaterialUsage>) => {
    const next = [...materialsUsed];
    const current = next[index];
    if (!current) return;

    const updated = { ...current, ...partial };
    const qty = Number(updated.quantity_used || 0);
    const unitCost = Number(updated.unit_cost || 0);
    updated.total_cost = qty * unitCost;

    next[index] = updated;
    setValue('materials_used', next, { shouldValidate: true });
  };

  const removeMaterialLine = (index: number) => {
    setValue('materials_used', materialsUsed.filter((_, i) => i !== index));
  };

  const handleEditBatch = (batch: ProductionBatchFormData) => {
    setEditingBatch(batch);
    reset({
      id: batch.id,
      batch_number: batch.batch_number,
      productId: batch.productId,
      quantity_produced: batch.quantity_produced,
      production_date: batch.production_date,
      status: batch.status,
      supervisorId: profile?.id || '',
      notes: batch.notes || '',
      materials_used: batch.materials_used || [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingBatch(null);
    reset({
      batch_number: generateBatchNumber(),
      productId: '',
      quantity_produced: 0,
      production_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'in-progress',
      supervisorId: profile?.id || '',
      notes: '',
      materials_used: [],
    });
  };

  const applyBatchInventoryEffect = async (
    transaction: any,
    batch: ProductionBatchFormData,
    multiplier: 1 | -1,
  ) => {
    const finishedProductRef = doc(firestore!, 'products', batch.productId);
    const finishedProductSnap = await transaction.get(finishedProductRef);
    const existingFinishedQty = Number(finishedProductSnap.data()?.quantity_on_hand || 0);
    const qtyProduced = Number(batch.quantity_produced || 0) * multiplier;
    transaction.update(finishedProductRef, {
      quantity_on_hand: Math.max(0, existingFinishedQty + qtyProduced),
      updatedAt: serverTimestamp(),
    });

    for (const material of batch.materials_used || []) {
      const materialRef = doc(firestore!, 'products', material.material_id);
      const materialSnap = await transaction.get(materialRef);
      const existingMaterialQty = Number(materialSnap.data()?.current_stock_quantity || 0);
      const qtyUsed = Number(material.quantity_used || 0) * multiplier;
      transaction.update(materialRef, {
        current_stock_quantity: Math.max(0, existingMaterialQty - qtyUsed),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleDeleteBatch = async (batch: ProductionBatchFormData) => {
    if (!firestore || !batch.id) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        await applyBatchInventoryEffect(transaction, batch, -1);
        const batchRef = doc(firestore, 'production-batches', batch.id as string);
        transaction.delete(batchRef);
      });

      toast({
        title: 'Batch Deleted',
        description: `${batch.batch_number} has been deleted and stock has been reversed.`,
      });

      if (editingBatch?.id === batch.id) {
        resetForm();
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
    console.log('[ProductionBatch] onSubmit called', { data, firestore: !!firestore, user: !!user, profile: !!profile, profileId: profile?.id });
    
    if (!firestore || !user || !profile) {
      console.warn('[ProductionBatch] Missing required data - firestore:', !!firestore, 'user:', !!user, 'profile:', !!profile);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing required data to save batch. Please try again.',
      });
      return;
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        if (editingBatch && editingBatch.id) {
          const batchRef = doc(firestore, 'production-batches', editingBatch.id as string);
          const existingBatchSnap = await transaction.get(batchRef);
          const existingBatch = existingBatchSnap.data() as ProductionBatchFormData | undefined;

          if (existingBatch) {
            await applyBatchInventoryEffect(transaction, existingBatch, -1);
          }
          await applyBatchInventoryEffect(transaction, data, 1);

          transaction.update(batchRef, {
            ...data,
            material_cost_total: materialCostTotal,
            updatedBy: profile.name,
            updatedAt: serverTimestamp(),
          });
        } else {
          await applyBatchInventoryEffect(transaction, data, 1);
          const batchRef = doc(collection(firestore, 'production-batches'));
          transaction.set(batchRef, {
            ...data,
            material_cost_total: materialCostTotal,
            logged_by: profile.name,
            createdAt: serverTimestamp(),
          });
        }
      });

      toast({
        title: editingBatch ? 'Batch Updated' : 'Batch Created',
        description: editingBatch
          ? `${data.batch_number} has been updated and inventory auto-adjusted.`
          : `${data.batch_number} has been created and inventory auto-adjusted.`,
      });

      resetForm();
      console.log('[ProductionBatch] Save completed successfully');
    } catch (e: any) {
      console.error('[ProductionBatch] Save failed:', e);
      const isOffline = !navigator.onLine;
      const isOffline = !navigator.onLine;
      if (isOffline && (e.code === 'unavailable' || e.message?.includes('offline') || e.message?.includes('Failed to get document'))) {
        toast({ title: 'Saved Offline', description: 'Production batch will sync when back online.' });
        resetForm();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not save production batch.',
        });
      }
    }
  };

  return (
    <div className="enterprise-form-shell space-y-6">
      <EnterpriseFormTips type="production" />
      <Card className="border-lg border-primary/20 bg-primary/5 shadow-comic-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How this page works</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            1) Choose what you produced. 2) Add raw materials you used. 3) Save. The system automatically updates finished stock and raw material stock for you.
          </CardDescription>
        </CardHeader>
      </Card>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Select Product</Label>
                {isLoadingProducts ? (
                  <Skeleton className="h-12 rounded-xl" />
                ) : (
                  <Select onValueChange={(value) => setValue('productId', value, { shouldValidate: true })} value={watch('productId')}>
                    <SelectTrigger className="h-12 border-lg rounded-xl font-bold">
                      <SelectValue placeholder="Choose the item you produced" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">Tip: choose from finished products only, for example soap, pads, body wash.</p>
                {!isLoadingProducts && !hasProducts && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
                    No finished products available. Add products first in <Link href="/enterprise/essentials/products" className="underline">Products</Link>.
                  </div>
                )}
                {errors.productId && <p className="text-xs text-destructive font-bold">{errors.productId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Production Date</Label>
                <Input type="date" {...register('production_date')} className="border-lg rounded-xl h-12 font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-dashed">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Batch Number</Label>
                <Input {...register('batch_number')} readOnly className="border-lg rounded-xl h-12 font-bold bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Quantity Produced</Label>
                <Input type="number" {...register('quantity_produced', { valueAsNumber: true })} className="border-lg rounded-xl h-12 font-bold text-lg" />
                <p className="text-xs text-muted-foreground">Enter the number of finished units made in this batch.</p>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Status</Label>
                <Select onValueChange={(value) => setValue('status', value as ProductionBatchFormData['status'])} value={watch('status')}>
                  <SelectTrigger className="h-12 border-lg rounded-xl font-bold"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-progress" className="font-bold">In Progress</SelectItem>
                    <SelectItem value="completed" className="font-bold">Completed</SelectItem>
                    <SelectItem value="on-hold" className="font-bold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-xs text-destructive font-bold">{errors.status.message}</p>}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-dashed">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-bold text-xs uppercase tracking-widest">Raw Materials Used</Label>
                  <p className="text-xs text-muted-foreground mt-1">Add the real material names and amounts used. This helps cost and stock reports stay accurate.</p>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">Add / Edit Raw Materials</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Raw Material Setup</DialogTitle>
                        <DialogDescription>Add a new raw material or packaging item using real names your team uses.</DialogDescription>
                      </DialogHeader>
                      <ProductForm onSuccess={() => setIsMaterialDialogOpen(false)} product={null} />
                    </DialogContent>
                  </Dialog>
                  <Button type="button" variant="secondary" size="sm" onClick={addMaterialLine}>Add Line</Button>
                </div>
              </div>

              {materialsUsed.length === 0 ? (
                <p className="text-xs text-muted-foreground">No materials added yet. Click “Add Line”.</p>
              ) : (
                <div className="space-y-3">
                  {materialsUsed.map((line, index) => (
                    <div key={`${line.material_id}-${index}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-lg border p-3">
                      <div className="sm:col-span-4">
                        <Select
                          onValueChange={(value) => {
                            const selected = materialProducts?.find((m) => m.id === value);
                            updateMaterialLine(index, {
                              material_id: value,
                              material_name: selected?.name || '',
                              unit: selected?.unit || 'unit',
                              unit_cost: Number(selected?.cost_per_unit || 0),
                            });
                          }}
                          value={line.material_id}
                        >
                          <SelectTrigger><SelectValue placeholder="Material name" /></SelectTrigger>
                          <SelectContent>
                            {materialProducts?.map((material) => (
                              <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Input type="number" value={line.quantity_used} onChange={(e) => updateMaterialLine(index, { quantity_used: Number(e.target.value || 0) })} placeholder="Qty" className="h-10" />
                      </div>
                      <div className="sm:col-span-2">
                        <Input value={line.unit} readOnly placeholder="Unit" className="h-10 bg-muted/50" />
                      </div>
                      <div className="sm:col-span-2">
                        <Input type="number" value={line.unit_cost} onChange={(e) => updateMaterialLine(index, { unit_cost: Number(e.target.value || 0) })} placeholder="Cost" className="h-10" />
                      </div>
                      <div className="sm:col-span-1 flex items-center text-sm font-semibold">{formatCurrency(line.total_cost || 0)}</div>
                      <div className="sm:col-span-1 flex items-center justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeMaterialLine(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-sm font-semibold">Total material cost: {formatCurrency(materialCostTotal)}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-dashed">
              <Label className="font-bold text-xs uppercase tracking-widest">Notes (Optional)</Label>
              <Input {...register('notes')} placeholder="Simple note e.g. Shift A, machine stopped for 20 mins" className="border-lg rounded-xl h-12 font-bold" />
            </div>
          </CardContent>
          <CardFooter className="enterprise-form-footer gap-2 flex-wrap">
            <Button type="submit" disabled={isSubmitting || !hasProducts} className="btn-omuto flex-1 w-full sm:w-auto sm:min-w-[220px] h-12 sm:h-14 text-xs sm:text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl mt-2 sm:mt-0">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {editingBatch ? 'Update Batch' : 'Save Production Batch'}
            </Button>
            {editingBatch && (
              <Button type="button" variant="outline" onClick={resetForm}>Cancel Edit</Button>
            )}
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Recorded Batches</CardTitle>
          <CardDescription>Open any saved batch below to edit or delete it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingBatches ? <Skeleton className="h-20 w-full" /> : (batches || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No batches recorded yet.</p>
          ) : (
            batches?.map((batch) => (
              <div key={batch.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{batch.batch_number}</p>
                  <p className="text-xs text-muted-foreground">{batch.production_date} • Qty {batch.quantity_produced}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleEditBatch(batch)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" size="sm">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this batch?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {batch.batch_number} and reverse stock updates.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteBatch(batch)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductionBatchForm;
