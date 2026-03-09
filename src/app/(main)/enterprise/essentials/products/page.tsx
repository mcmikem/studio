'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Package, PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
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

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
      <div className="flex justify-between items-center">
        <PageHeader
          icon={Package}
          title="Product & Material Management"
          description="Manage all finished goods, raw materials, and packaging."
        />
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>


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
