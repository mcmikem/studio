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
import { useState, useRef, useEffect } from 'react';
import { starterProducts } from '@/lib/enterprise-starter-catalog';
import { uploadFile } from '@/firebase/storage';
import { buildUploadPath } from '@/lib/upload-paths';
import { useFirebaseApp, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const { user } = useUser();
  const { toast } = useToast();
  const isEditMode = !!product;
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(product?.image_url || '');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please select a JPG, PNG, or WebP image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Image too large', description: `This image is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please use an image smaller than 5MB.` });
      return;
    }
    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

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

  const applyStarterTemplate = (sku: string) => {
    const template = starterProducts.find((item) => item.sku === sku);
    if (!template) return;

    reset({
      ...watch(),
      name: template.name,
      sku: template.sku,
      description: template.description,
      unit: template.unit,
      type: template.type,
      default_selling_price: template.default_selling_price || 0,
      cost_per_unit: template.cost_per_unit || 0,
      reorder_level: template.reorder_level || 0,
      quantity_on_hand: template.quantity_on_hand || 0,
      current_stock_quantity: template.current_stock_quantity || 0,
      location: template.location || '',
      categoryId: '__create__',
      is_active: true,
    });
    setNewCategoryName(template.category);
    toast({ title: 'Template applied', description: `${template.name} fields pre-filled.` });
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!firestore) return;

    let categoryId = data.categoryId;
    if (categoryId === '__create__') {
      if (!newCategoryName.trim()) {
        toast({ variant: 'destructive', title: 'Category name required', description: 'Enter a category name or choose an existing category.' });
        return;
      }
      const categoryRef = await addDocumentNonBlocking(collection(firestore, 'product-categories'), {
        name: newCategoryName.trim(),
        createdAt: serverTimestamp(),
      });
      categoryId = categoryRef.id;
    }

    const submissionData: any = {
        ...data,
        categoryId,
        updatedAt: serverTimestamp(),
    };

    // Handle Image Upload
    if (photoFile && app) {
        setIsPhotoUploading(true);
        try {
            const ext = photoFile.name.split('.').pop() || 'jpg';
            const sku = data.sku || 'general';
            const catId = categoryId || 'uncategorized';
            const imageUrl = await uploadFile(app, photoFile, buildUploadPath.productImage(catId, sku, ext));
            submissionData.image_url = imageUrl;
        } catch (uploadError: any) {
            console.error("Image upload failed:", uploadError);
            toast({ variant: 'destructive', title: 'Image upload failed', description: uploadError.message });
        } finally {
            setIsPhotoUploading(false);
        }
    } else if (!photoPreview && isEditMode) {
        // If user cleared the preview, remove the image URL
        submissionData.image_url = null;
    }

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
      {!isEditMode && (
        <div className="space-y-2">
          <Label>Starter Template (Optional)</Label>
          <Select onValueChange={applyStarterTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a ready Omuto Essentials product/material" />
            </SelectTrigger>
            <SelectContent>
              {starterProducts.map((item) => (
                <SelectItem key={item.sku} value={item.sku}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Image Upload Area */}
      <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
          <Avatar className="h-32 w-32 border-4 border-white shadow-comic-sm mb-2 rounded-2xl">
              <AvatarImage src={photoPreview} className="object-cover" />
              <AvatarFallback className="bg-omuto-navy/5 text-omuto-navy/20"><Upload className="h-10 w-10" /></AvatarFallback>
          </Avatar>
          {isPhotoUploading ? (
              <div className="flex items-center gap-2 text-xs font-black uppercase text-primary animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin"/> Processing...
              </div>
          ) : (
              <p className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-primary transition-colors">
                  {photoPreview ? 'Tap to change photo' : 'Tap to add photo'}
              </p>
          )}
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} />
      </div>

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
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a category..."/></SelectTrigger><SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}<SelectItem value="__create__">+ Create new category</SelectItem></SelectContent></Select>
            )}/>
        )}
        {watch('categoryId') === '__create__' && (
          <div className="space-y-2">
            <Label htmlFor="new-category-name">New Category Name</Label>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Cleaning Supplies"
            />
          </div>
        )}
        {!isLoadingCategories && (!categories || categories.length === 0) && (
          <p className="text-xs text-muted-foreground">No categories found yet. Select “Create new category” to add one now.</p>
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
