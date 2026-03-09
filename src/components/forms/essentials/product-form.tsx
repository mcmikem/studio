'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ProductFormSchema,
  type ProductFormData,
  type ProductCategory,
  type Product,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditMode = !!product;

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'product-categories'), orderBy('name'));
  }, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<ProductCategory>(categoriesQuery);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: isEditMode && product ? {
      ...product,
      // Ensure numbers are handled correctly
      default_selling_price: product.default_selling_price || 0,
      cost_per_unit: product.cost_per_unit || 0,
      reorder_level: product.reorder_level || 0,
      quantity_on_hand: product.quantity_on_hand || 0,
      current_stock_quantity: product.current_stock_quantity || 0,
    } : {
      type: 'finished',
      is_active: true,
      unit: 'piece',
    },
  });
  
  const productType = watch('type');

  const onSubmit = async (data: ProductFormData) => {
    if (!firestore) return;

    const submissionData = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    if (isEditMode && product) {
        await updateDocumentNonBlocking(doc(firestore, 'products', product.id), submissionData);
        toast({ title: 'Product updated successfully' });
    } else {
        await addDocumentNonBlocking(collection(firestore, 'products'), {
            ...submissionData,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Product created successfully' });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product/Material Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Controller name="type" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="finished">Finished Good</SelectItem><SelectItem value="raw">Raw Material</SelectItem><SelectItem value="packaging">Packaging</SelectItem></SelectContent></Select>
            )}/>
          </div>
      </div>
       <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        {isLoadingCategories ? <Skeleton className="h-10"/> : (
             <Controller name="categoryId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a category..."/></SelectTrigger><SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            )}/>
        )}
        {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
      </div>
      <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" {...register('sku')} /></div>
          <div className="space-y-2"><Label htmlFor="unit">Unit</Label><Input id="unit" {...register('unit')} placeholder="e.g., piece, kg, liter" /></div>
      </div>
      
      {productType === 'finished' ? (
        <div className="space-y-4 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold text-sm">Finished Good Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Default Selling Price</Label><Input type="number" {...register('default_selling_price')} /></div>
                <div className="space-y-2"><Label>Quantity on Hand</Label><Input type="number" {...register('quantity_on_hand')} /></div>
            </div>
            <div className="space-y-2"><Label>Storage Location</Label><Input {...register('location')} placeholder="e.g., Main Store" /></div>
        </div>
      ) : (
        <div className="space-y-4 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold text-sm">Raw Material/Packaging Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Cost per Unit</Label><Input type="number" {...register('cost_per_unit')} /></div>
                <div className="space-y-2"><Label>Current Stock Quantity</Label><Input type="number" {...register('current_stock_quantity')} /></div>
            </div>
             <div className="space-y-2"><Label>Re-order Level</Label><Input type="number" {...register('reorder_level')} /></div>
        </div>
      )}
       <div className="flex items-center space-x-2">
            <Controller name="is_active" control={control} render={({ field }) => (
                <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
            )} />
            <Label htmlFor="is_active">Product is Active</Label>
        </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Save Changes' : 'Create Product'}
        </Button>
      </DialogFooter>
    </form>
  );
}
