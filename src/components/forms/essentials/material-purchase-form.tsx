'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialPurchaseSchema, type MaterialPurchase, type Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, runTransaction, query, where } from 'firebase/firestore';
import { Loader2, ArrowLeft, ShoppingBag, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { useEffect, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { z } from 'zod';

const MaterialPurchaseFormSchema = z.object({
    material_id: z.string(),
    purchase_date: z.string(),
    quantity: z.number(),
    unit_cost: z.number(),
    total_cost: z.number(),
    supplier_name: z.string().optional(),
});

export function MaterialPurchaseForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const materialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('type', 'in', ['raw', 'packaging']));
  }, [firestore]);
  const { data: materials, isLoading: isLoadingMaterials } = useCollection<Product>(materialsQuery);

  const form = useForm<z.infer<typeof MaterialPurchaseFormSchema>>({
    resolver: zodResolver(MaterialPurchaseFormSchema),
    defaultValues: {
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      quantity: 0,
      unit_cost: 0,
      total_cost: 0,
      supplier_name: '',
    },
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = form;

  const watchedQty = watch('quantity');
  const watchedUnitCost = watch('unit_cost');

  useEffect(() => {
    const qty = Number(watchedQty) || 0;
    const cost = Number(watchedUnitCost) || 0;
    setValue('total_cost', qty * cost);
  }, [watchedQty, watchedUnitCost, setValue]);

  const onSubmit = async (data: any) => {
    if (!firestore || !user || !profile) return;
    
    const material = materials?.find(m => m.id === data.material_id);
    if (!material) return;

    try {
        await runTransaction(firestore, async (transaction) => {
            const purchaseRef = doc(collection(firestore, 'material-purchases'));
            const materialRef = doc(firestore, 'products', data.material_id);

            // 1. Log Purchase
            transaction.set(purchaseRef, {
                ...data,
                material_name: material.name,
                logged_by: profile.name,
                createdAt: serverTimestamp(),
            });

            // 2. Update Stock
            const currentStock = material.current_stock_quantity || 0;
            transaction.update(materialRef, {
                current_stock_quantity: currentStock + Number(data.quantity),
                last_restocked_at: serverTimestamp(),
                cost_per_unit: Number(data.unit_cost)
            });
        });

        toast({ title: 'Restock Complete!', description: `${data.quantity} units added to ${material.name}.` });
        router.push('/enterprise/essentials');
    } catch (e: any) {
        console.error("Purchase log failed:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not record purchase.' });
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href="/enterprise/essentials"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
      </Button>
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter"><ShoppingBag className="h-8 w-8 text-primary"/> Material Procurement</CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Record the purchase of raw materials or packaging to update stock levels.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Select Material</Label>
                    {isLoadingMaterials ? <Skeleton className="h-12 rounded-xl" /> : (
                        <Controller name="material_id" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-12 border-lg rounded-xl font-bold"><SelectValue placeholder="Which material?" /></SelectTrigger>
                                <SelectContent>{materials?.map(m => <SelectItem key={m.id} value={m.id} className="font-bold">{m.name} ({m.unit})</SelectItem>)}</SelectContent>
                            </Select>
                        )}/>
                    )}
                    {errors.material_id && <p className="text-xs text-destructive font-bold">{errors.material_id.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Purchase Date</Label>
                    <Input type="date" {...register('purchase_date')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-dashed">
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Quantity Purchased</Label>
                    <Input type="number" step="0.01" {...register('quantity', { valueAsNumber: true })} className="border-lg rounded-xl h-12 font-bold text-lg" />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Unit Cost (UGX)</Label>
                    <Input type="number" {...register('unit_cost', { valueAsNumber: true })} className="border-lg rounded-xl h-12 font-bold text-lg" />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Total Cost</Label>
                    <div className="h-12 border-lg rounded-xl flex items-center px-4 bg-muted/50 font-black text-primary">
                        {formatCurrency(watch('total_cost') || 0)}
                    </div>
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-dashed">
                <Label className="font-bold text-xs uppercase tracking-widest">Supplier Name (Optional)</Label>
                <Input {...register('supplier_name')} placeholder="e.g., Mukwano Industries" className="border-lg rounded-xl h-12 font-bold" />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t-lg border-omuto-navy/10 p-8">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Commit Purchase & Update Inventory
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
