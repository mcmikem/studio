'use client';

import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaleFormSchema, type SaleFormData, type Product } from '@/lib/types';
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
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, query, where, writeBatch } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DialogFooter } from '@/components/ui/dialog';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export function SalesTrackingForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('type', '==', 'finished'), where('is_active', '==', true));
  }, [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(SaleFormSchema),
    defaultValues: {
      sale_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'Cash',
      status: 'completed',
      items: [{ product_id: '', product_name: '', quantity: 1, unit_price: 0, total: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const totalAmount = useMemo(() => {
    return watchedItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [watchedItems]);

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      const quantity = form.getValues(`items.${index}.quantity`) || 1;
      form.setValue(`items.${index}.product_id`, productId);
      form.setValue(`items.${index}.product_name`, product.name);
      form.setValue(`items.${index}.unit_price`, product.default_selling_price || 0);
      form.setValue(`items.${index}.total`, quantity * (product.default_selling_price || 0));
      form.trigger(`items`);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const unitPrice = form.getValues(`items.${index}.unit_price`) || 0;
    form.setValue(`items.${index}.quantity`, quantity);
    form.setValue(`items.${index}.total`, quantity * unitPrice);
    form.trigger(`items`);
  };

  const onSubmit = async (data: SaleFormData) => {
    if (!firestore || !user) return;
    const batch = writeBatch(firestore);

    // 1. Create Sale document
    const saleRef = doc(collection(firestore, 'sales'));
    batch.set(saleRef, {
      ...data,
      total_amount: totalAmount,
      created_by: user.uid,
      createdAt: serverTimestamp(),
      transaction_number: `SALE-${Date.now()}`
    });

    // 2. Decrement stock for each product sold
    for (const item of data.items) {
        const productRef = doc(firestore, 'products', item.product_id);
        const product = products?.find(p => p.id === item.product_id);
        if (product) {
            const newQuantity = (product.quantity_on_hand || 0) - item.quantity;
            batch.update(productRef, { quantity_on_hand: newQuantity });
        }
    }
    
    try {
        await batch.commit();
        toast({ title: 'Sale Recorded!', description: `Transaction has been successfully logged.` });
        router.push('/enterprise/essentials');
    } catch (e: any) {
        console.error("Error recording sale:", e);
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not record sale.'});
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
                <CardTitle>Record a New Sale</CardTitle>
                <CardDescription>Log a sales transaction and automatically update inventory.</CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Sale Date</Label><Input type="date" {...form.register('sale_date')} /></div>
                    <div className="space-y-2"><Label>Created By</Label><Input value={profile?.name || ''} disabled /></div>
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Customer Name (Optional)</Label><Input {...form.register('customer_name')} /></div>
                    <div className="space-y-2"><Label>Customer Phone (Optional)</Label><Input {...form.register('customer_phone')} /></div>
                </div>
                
                 <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">Items</h3>
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md">
                            <div className="col-span-12 md:col-span-5 space-y-1"><Label>Product</Label>
                            {isLoadingProducts ? <Skeleton className="h-10"/> : (
                                <Controller name={`items.${index}.product_id`} control={form.control} render={({ field }) => (
                                    <Select onValueChange={(value) => handleProductChange(index, value)} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                                )}/>
                            )}
                            </div>
                            <div className="col-span-4 md:col-span-2 space-y-1"><Label>Qty</Label><Input type="number" {...form.register(`items.${index}.quantity`)} onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10))}/></div>
                            <div className="col-span-4 md:col-span-2 space-y-1"><Label>Price</Label><Input type="number" readOnly value={form.watch(`items.${index}.unit_price`)}/></div>
                            <div className="col-span-4 md:col-span-2 space-y-1"><Label>Total</Label><Input readOnly value={form.watch(`items.${index}.total`)} /></div>
                            <div className="col-span-12 md:col-span-1"><Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button></div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', product_name: '', quantity: 1, unit_price: 0, total: 0 })}><PlusCircle className="mr-2 h-4 w-4" />Add Item</Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Payment Method</Label><Controller name="payment_method" control={form.control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Mobile Money">Mobile Money</SelectItem><SelectItem value="Bank Transfer">Bank Transfer</SelectItem></SelectContent></Select>)}/></div>
                    <div className="space-y-2"><Label>Status</Label><Controller name="status" control={form.control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select>)}/></div>
                </div>

                <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                    <span className="font-bold text-lg">Grand Total</span>
                    <span className="font-bold text-xl">{formatCurrency(totalAmount)}</span>
                </div>
            </CardContent>
             <CardFooter>
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Sale
                </Button>
            </CardFooter>
            </form>
        </Card>
    </div>
  )
}
