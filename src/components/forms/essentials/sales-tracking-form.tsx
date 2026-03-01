'use client';

import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaleFormSchema, type SaleFormData, type Product, type Partnership } from '@/lib/types';
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, query, where, writeBatch, orderBy } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, ArrowLeft, ShoppingCart, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

  const partnersQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'partnerships'), orderBy('name'));
  }, [firestore]);
  const { data: partners, isLoading: isLoadingPartners } = useCollection<Partnership>(partnersQuery);

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

  const handlePartnerChange = (partnerId: string) => {
      const partner = partners?.find(p => p.id === partnerId);
      if (partner) {
          form.setValue('customer_name', partner.name);
          form.setValue('customer_phone', partner.contactPhone || '');
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

    const saleRef = doc(collection(firestore, 'sales'));
    batch.set(saleRef, {
      ...data,
      total_amount: totalAmount,
      created_by: user.uid,
      createdAt: serverTimestamp(),
      transaction_number: `SALE-${format(new Date(), 'yyMMdd')}-${Date.now().toString().slice(-4)}`
    });

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
        toast({ title: 'Sale Recorded!', description: `Transaction recorded and inventory adjusted.` });
        router.push('/enterprise/essentials');
    } catch (e: any) {
        console.error("Error recording sale:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not record sale.'});
    }
  };

  return (
    <div className="space-y-4 pb-10">
         <Button variant="outline" asChild className="rounded-xl border-lg">
            <Link href="/enterprise/essentials"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
        </Button>
        <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
                <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter"><ShoppingCart className="h-8 w-8 text-primary"/> Point of Sale</CardTitle>
                <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Record a customer transaction and automatically update finished goods inventory.</CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8 pt-8">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest">Sale Date</Label>
                        <Input type="date" {...form.register('sale_date')} className="border-lg rounded-xl h-12 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest">Cashier</Label>
                        <div className="h-12 border-lg rounded-xl flex items-center px-4 bg-muted/50 font-bold text-omuto-navy/70 uppercase text-xs tracking-widest">
                            {profile?.name || 'Loading...'}
                        </div>
                    </div>
                </div>

                 <div className="p-6 bg-primary/5 border-lg border-primary/20 rounded-3xl space-y-4">
                    <h3 className="font-black uppercase text-xs tracking-widest text-primary flex items-center gap-2"><UserCheck className="h-4 w-4"/> Customer Information</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Existing Partner (Auto-fill)</Label>
                            {isLoadingPartners ? <Skeleton className="h-11 rounded-xl" /> : (
                                <Select onValueChange={handlePartnerChange}>
                                    <SelectTrigger className="h-11 border-lg rounded-xl font-bold bg-white"><SelectValue placeholder="Select partner..." /></SelectTrigger>
                                    <SelectContent>{partners?.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>)}</SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Customer Name</Label>
                            <Input {...form.register('customer_name')} className="h-11 border-lg rounded-xl font-bold bg-white" placeholder="Manual entry if guest" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Phone Number</Label>
                            <Input {...form.register('customer_phone')} className="h-11 border-lg rounded-xl font-bold bg-white" />
                        </div>
                    </div>
                 </div>
                
                 <div className="space-y-4 pt-4">
                    <h3 className="font-black uppercase text-xs tracking-widest text-muted-foreground">Order Items</h3>
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-3 items-end p-4 bg-muted/20 border-lg rounded-2xl relative">
                                <div className="col-span-12 md:col-span-4 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product</Label>
                                    {isLoadingProducts ? <Skeleton className="h-10 rounded-xl"/> : (
                                        <Controller name={`items.${index}.product_id`} control={form.control} render={({ field }) => (
                                            <Select onValueChange={(value) => handleProductChange(index, value)} value={field.value}><SelectTrigger className="h-11 border-lg rounded-xl font-bold bg-white"><SelectValue placeholder="Select product..." /></SelectTrigger><SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>)}</SelectContent></Select>
                                        )}/>
                                    )}
                                </div>
                                <div className="col-span-4 md:col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qty</Label><Input type="number" {...form.register(`items.${index}.quantity`)} className="h-11 border-lg rounded-xl font-bold bg-white" onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10))}/></div>
                                <div className="col-span-4 md:col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price</Label><Input type="number" readOnly value={form.watch(`items.${index}.unit_price`)} className="h-11 border-lg rounded-xl font-bold bg-muted/50" /></div>
                                <div className="col-span-4 md:col-span-3 space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</Label><div className="h-11 border-lg rounded-xl flex items-center px-4 bg-muted/50 font-bold text-omuto-navy">{formatCurrency(form.watch(`items.${index}.total`))}</div></div>
                                <div className="col-span-12 md:col-span-1"><Button variant="ghost" size="icon" className="h-11 w-11 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => remove(index)}><Trash2 className="h-5 w-5"/></Button></div>
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', product_name: '', quantity: 1, unit_price: 0, total: 0 })} className="font-black text-xs uppercase tracking-widest border-lg rounded-xl h-10 px-4"><PlusCircle className="mr-2 h-4 w-4" />Add Product Item</Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-dashed">
                    <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest">Payment Method</Label><Controller name="payment_method" control={form.control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-12 border-lg rounded-xl font-bold"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Cash" className="font-bold">Cash</SelectItem><SelectItem value="Mobile Money" className="font-bold">Mobile Money</SelectItem><SelectItem value="Bank Transfer" className="font-bold">Bank Transfer</SelectItem></SelectContent></Select>)}/></div>
                    <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest">Transaction Status</Label><Controller name="status" control={form.control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-12 border-lg rounded-xl font-bold"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="completed" className="font-bold text-green-600">Completed (Paid)</SelectItem><SelectItem value="pending" className="font-bold text-orange-600">Pending (Invoice)</SelectItem></SelectContent></Select>)}/></div>
                </div>

                <div className="p-8 bg-omuto-navy text-white rounded-3xl flex justify-between items-center shadow-comic-lg mt-6">
                    <span className="font-black uppercase tracking-widest text-white/60">Grand Total Payable</span>
                    <span className="font-black text-4xl italic tracking-tighter">{formatCurrency(totalAmount)}</span>
                </div>
            </CardContent>
             <CardFooter className="p-8 bg-muted/30 border-t-lg border-omuto-navy/10 mt-6">
                <Button type="submit" disabled={form.formState.isSubmitting} className="btn-omuto w-full h-16 text-lg font-black uppercase tracking-widest shadow-comic-lg rounded-2xl border-white">
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <ShoppingCart className="mr-2 h-6 w-6" />}
                Process Sale & Print Receipt
                </Button>
            </CardFooter>
            </form>
        </Card>
    </div>
  )
}
