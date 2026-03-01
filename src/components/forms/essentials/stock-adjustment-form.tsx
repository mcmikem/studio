'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StockAdjustmentSchema, type StockAdjustment, type Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, runTransaction, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, AlertTriangle, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

export function StockAdjustmentForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('name'));
  }, [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const form = useForm<Partial<StockAdjustment>>({
    resolver: zodResolver(StockAdjustmentSchema.omit({ id: true, createdAt: true, logged_by: true })),
    defaultValues: {
      adjustment_date: format(new Date(), 'yyyy-MM-dd'),
      adjustment_type: 'Damage',
      quantity: 0,
    },
  });

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = form;

  const onSubmit = async (data: any) => {
    if (!firestore || !user || !profile) return;
    
    const product = products?.find(p => p.id === data.product_id);
    if (!product) return;

    try {
        await runTransaction(firestore, async (transaction) => {
            const adjustmentRef = doc(collection(firestore, 'stock-adjustments'));
            const productRef = doc(firestore, 'products', data.product_id);

            // 1. Log Adjustment
            transaction.set(adjustmentRef, {
                ...data,
                product_name: product.name,
                logged_by: profile.name,
                createdAt: serverTimestamp(),
            });

            // 2. Update Stock (decrement for damage/loss/correction)
            const currentStock = (product.type === 'finished' ? product.quantity_on_hand : product.current_stock_quantity) || 0;
            const newStock = currentStock - Number(data.quantity);
            
            if (newStock < 0) throw new Error("Adjustment would result in negative stock.");

            if (product.type === 'finished') {
                transaction.update(productRef, { quantity_on_hand: newStock });
            } else {
                transaction.update(productRef, { current_stock_quantity: newStock });
            }
        });

        toast({ title: 'Adjustment Recorded', description: `${data.quantity} units adjusted from ${product.name}.` });
        router.push('/enterprise/essentials');
    } catch (e: any) {
        console.error("Adjustment failed:", e);
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not record adjustment.' });
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href="/enterprise/essentials"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
      </Button>
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter text-destructive"><AlertTriangle className="h-8 w-8"/> Stock Adjustment</CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Record damages, losses, or stock corrections for products and raw materials.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Select Item</Label>
                    {isLoadingProducts ? <Skeleton className="h-12 rounded-xl" /> : (
                        <Controller name="product_id" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-12 border-lg rounded-xl font-bold"><SelectValue placeholder="Which item?" /></SelectTrigger>
                                <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        )}/>
                    )}
                    {errors.product_id && <p className="text-xs text-destructive font-bold">{errors.product_id.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Adjustment Type</Label>
                    <Controller name="adjustment_type" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-12 border-lg rounded-xl font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Damage" className="font-bold">Damage / Spoiled</SelectItem>
                                <SelectItem value="Loss" className="font-bold">Loss / Theft</SelectItem>
                                <SelectItem value="Correction" className="font-bold">Inventory Correction</SelectItem>
                                <SelectItem value="Return" className="font-bold">Product Return</SelectItem>
                            </SelectContent>
                        </Select>
                    )}/>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Quantity</Label>
                    <Input type="number" step="0.01" {...register('quantity')} className="border-lg rounded-xl h-12 font-bold text-lg text-destructive" />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Adjustment Date</Label>
                    <Input type="date" {...register('adjustment_date')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-dashed">
                <Label className="font-bold text-xs uppercase tracking-widest">Reason for Adjustment</Label>
                <Textarea {...register('reason')} placeholder="Provide details on why this adjustment is being made..." className="border-lg rounded-xl min-h-[100px] font-bold" />
                {errors.reason && <p className="text-xs text-destructive font-bold">{errors.reason.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t-lg border-omuto-navy/10 p-8">
            <Button type="submit" disabled={isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl bg-destructive border-white hover:bg-destructive/90">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Update Stock Records
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
