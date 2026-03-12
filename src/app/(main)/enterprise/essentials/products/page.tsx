'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, where, getDocs, serverTimestamp } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Package, PlusCircle, Edit, Trash2, DatabaseZap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProductForm } from '@/components/forms/essentials/product-form';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { starterCategories, starterProducts } from '@/lib/enterprise-starter-catalog';
import { EnterpriseFormTips } from '@/components/forms/essentials/enterprise-form-tips';

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => {
    return query(collection(firestore!, 'products'), orderBy('name'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'products', product.id))
      .then(() => toast({ title: "Product Deleted" }))
      .catch((e) => toast({ variant: 'destructive', title: "Error", description: e.message }));
  };

  const handleSeedStarterCatalog = async () => {
    if (!firestore || isSeeding) return;
    setIsSeeding(true);
    try {
      const categoryIdByName: Record<string, string> = {};

      for (const category of starterCategories) {
        const existingCategorySnapshot = await getDocs(
          query(collection(firestore, 'product-categories'), where('name', '==', category.name))
        );

        if (!existingCategorySnapshot.empty) {
          categoryIdByName[category.name] = existingCategorySnapshot.docs[0].id;
          continue;
        }

        const newCategoryRef = await addDocumentNonBlocking(collection(firestore, 'product-categories'), {
          name: category.name,
          createdAt: serverTimestamp(),
        });
        categoryIdByName[category.name] = newCategoryRef.id;
      }

      let createdCount = 0;
      for (const starter of starterProducts) {
        const existingProductSnapshot = await getDocs(
          query(collection(firestore, 'products'), where('sku', '==', starter.sku))
        );
        if (!existingProductSnapshot.empty) continue;

        await addDocumentNonBlocking(collection(firestore, 'products'), {
          ...starter,
          categoryId: categoryIdByName[starter.category],
          is_active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        createdCount += 1;
      }

      toast({
        title: 'Starter catalog ready',
        description: createdCount > 0
          ? `Added ${createdCount} products/materials for Essentials.`
          : 'Starter catalog already exists. No duplicates added.',
      });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Seeding failed', description: error?.message || 'Could not seed starter catalog.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant={row.original.type === 'finished' ? 'default' : 'secondary'}>{row.original.type}</Badge>
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
    },
    {
      accessorKey: 'default_selling_price',
      header: 'Price',
      cell: ({ row }) => row.original.type === 'finished' ? formatCurrency(row.original.default_selling_price || 0) : 'N/A'
    },
     {
      accessorKey: 'cost_per_unit',
      header: 'Cost',
      cell: ({ row }) => row.original.type === 'raw' ? formatCurrency(row.original.cost_per_unit || 0) : 'N/A'
    },
    {
      accessorKey: 'stock',
      header: 'Stock on Hand',
      cell: ({ row }) => row.original.type === 'finished' ? row.original.quantity_on_hand : row.original.current_stock_quantity
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}><Edit className="h-4 w-4" /></Button>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{row.original.name}".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(row.original)}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <PageHeader
          icon={Package}
          title="Product & Material Management"
          description="Manage all finished goods, raw materials, and packaging."
        />
        <div className="flex w-full sm:w-auto gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={handleSeedStarterCatalog} disabled={isSeeding} className="w-full sm:w-auto">
            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />} Seed Starter Catalog
          </Button>
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <EnterpriseFormTips type="products" />


      <DataTable 
        columns={columns} 
        data={products || []} 
        isLoading={isLoading} 
        renderMobileCard={(product) => (
          <div className="p-4 border rounded-xl bg-background shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-bold text-omuto-navy text-lg">{product.name}</p>
                <div className="flex gap-2 items-center">
                    <Badge variant={product.type === 'finished' ? 'default' : 'secondary'} className="text-[10px] uppercase">{product.type}</Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">{product.sku}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Stock</p>
                <p className="font-black text-primary">{product.type === 'finished' ? product.quantity_on_hand : product.current_stock_quantity}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-dashed">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{product.type === 'finished' ? 'Price' : 'Cost'}</p>
                <p className="font-bold">
                  {product.type === 'finished' ? formatCurrency(product.default_selling_price || 0) : formatCurrency(product.cost_per_unit || 0)}
                </p>
              </div>
               <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete "{product.name}"?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this item from inventory.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(product)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
            </div>
          </div>
        )}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              Fill in the details for your product or raw material.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
