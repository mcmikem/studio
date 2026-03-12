'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomerFeedbackSchema, type CustomerFeedback, type Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, addDoc, query, where, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, MessageSquare, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { EnterpriseFormTips } from './enterprise-form-tips';

const CustomerFeedbackFormSchema = z.object({
    customer_name: z.string().optional(),
    date: z.string(),
    product_name: z.string(),
    rating: z.number().min(1).max(5),
    feedback: z.string(),
});

export function CustomerFeedbackForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('type', '==', 'finished'));
  }, [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const hasProducts = (products?.length || 0) > 0;

  const form = useForm<z.infer<typeof CustomerFeedbackFormSchema>>({
    resolver: zodResolver(CustomerFeedbackFormSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      rating: 5,
      customer_name: '',
      product_name: '',
      feedback: '',
    },
  });

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = form;

  const onSubmit = async (data: any) => {
    if (!firestore || !user || !profile) return;

    try {
        await addDoc(collection(firestore, 'customer-feedback'), {
            ...data,
            logged_by: profile.name,
            createdAt: serverTimestamp(),
        });

        toast({ title: 'Feedback Recorded', description: 'Thank you for capturing customer insights!' });
        router.push('/enterprise/essentials');
    } catch (e: any) {
        console.error("Feedback log failed:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not record feedback.' });
    }
  };

  return (
    <div className="enterprise-form-shell">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href="/enterprise/essentials"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
      </Button>
      <EnterpriseFormTips type="feedback" />
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter"><MessageSquare className="h-8 w-8 text-primary"/> Customer Feedback</CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Log feedback, complaints, or suggestions from customers about our products.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Customer Name (Optional)</Label>
                    <Input {...register('customer_name')} placeholder="e.g., Sarah N." className="border-lg rounded-xl h-12 font-bold" />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Date</Label>
                    <Input type="date" {...register('date')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
                <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Product</Label>
                    {isLoadingProducts ? <Skeleton className="h-12 rounded-xl" /> : (
                        <Controller name="product_name" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-12 border-lg rounded-xl font-bold"><SelectValue placeholder="Select product..." /></SelectTrigger>
                                <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.name} className="font-bold">{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        )}/>
                    )}
                    {!isLoadingProducts && !hasProducts && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
                        No finished products found. Add products first in{' '}
                        <Link href="/enterprise/essentials/products" className="underline">Products</Link>.
                      </div>
                    )}
                     {errors.product_name && <p className="text-xs text-destructive font-bold">{errors.product_name.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest">Rating (1-5)</Label>
                    <Controller name="rating" control={control} render={({ field }) => (
                         <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Button
                                    key={star}
                                    type="button"
                                    variant={field.value && field.value >= star ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => field.onChange(star)}
                                    className={`h-12 w-12 rounded-xl border-lg ${field.value && field.value >= star ? 'bg-omuto-yellow text-omuto-brown border-omuto-yellow' : ''}`}
                                >
                                    <Star className={`h-6 w-6 ${field.value && field.value >= star ? 'fill-current' : ''}`} />
                                </Button>
                            ))}
                        </div>
                    )}/>
                    {errors.rating && <p className="text-xs text-destructive font-bold">{errors.rating.message}</p>}
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-dashed">
                <Label className="font-bold text-xs uppercase tracking-widest">Feedback / Comments</Label>
                <Textarea {...register('feedback')} placeholder="What did they say? Be specific about quality, price, or usage..." className="border-lg rounded-xl min-h-[100px] font-bold" />
                {errors.feedback && <p className="text-xs text-destructive font-bold">{errors.feedback.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="enterprise-form-footer">
            <Button type="submit" disabled={isSubmitting || !hasProducts} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MessageSquare className="mr-2 h-5 w-5" />}
              Save Feedback
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
