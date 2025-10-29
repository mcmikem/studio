'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import type { Equipment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Box, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
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
} from "@/components/ui/alert-dialog"
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';

const statusColors: { [key: string]: string } = {
    "Available": "border-green-500 bg-green-500/10 text-green-500",
    "In Use": "border-blue-500 bg-blue-500/10 text-blue-500",
    "Under Maintenance": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
};

const conditionColors: { [key: string]: string } = {
    "Good": "border-green-500 bg-green-500/10 text-green-500",
    "Fair": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "Poor": "border-red-500 bg-red-500/10 text-red-500",
};


const equipmentSchema = z.object({
  name: z.string().min(3, "Equipment name is required."),
  category: z.string().min(3, "Category is required."),
  status: z.enum(["Available", "In Use", "Under Maintenance"]),
  condition: z.enum(["Good", "Fair", "Poor"]),
  currentHolder: z.string().min(2, "Current holder is required."),
  purchaseDate: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    try {
        return format(new Date(date), 'yyyy-MM-dd');
    } catch {
        return '';
    }
};

function EquipmentForm({
  equipment,
  onFormSubmit,
}: {
  equipment?: Equipment;
  onFormSubmit: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
     defaultValues: equipment ? {
        ...equipment,
        purchaseDate: formatDateForInput(equipment.purchaseDate),
     } : {
      status: 'Available',
      condition: 'Good',
      currentHolder: 'Office',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: EquipmentFormData) => {
    if (!firestore) return;

    if (equipment) {
        const equipmentRef = doc(firestore, 'equipment', equipment.id);
        updateDocumentNonBlocking(equipmentRef, data);
        toast({
            title: "Equipment Updated!",
            description: `${data.name} has been successfully updated.`,
        });
    } else {
        const equipmentCollection = collection(firestore, 'equipment');
        const newEquipment = {
          ...data,
          createdAt: serverTimestamp(),
        };
        addDocumentNonBlocking(equipmentCollection, newEquipment);
        toast({
          title: "Equipment Added!",
          description: `${data.name} has been added to the inventory.`,
        });
    }
    
    reset();
    onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Equipment Name</Label>
          <Input id="name" {...register("name")} placeholder="e.g., Canon Camera 5D" />
          {errors.name && <p className="text-sm text-destructive">{`${errors.name.message}`}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...register("category")} placeholder="e.g., Electronics, Furniture" />
          {errors.category && <p className="text-sm text-destructive">{`${errors.category.message}`}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Controller name="status" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="In Use">In Use</SelectItem>
                        <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                    </SelectContent>
                </Select>
            )} />
        </div>
         <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Controller name="condition" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                </Select>
            )} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="currentHolder">Current Holder</Label>
            <Input id="currentHolder" {...register("currentHolder")} placeholder="e.g., Alex Nsereko" />
            {errors.currentHolder && <p className="text-sm text-destructive">{`${errors.currentHolder.message}`}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (equipment ? 'Saving...' : 'Adding...') : (equipment ? 'Save Changes' : 'Add Equipment')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function EquipmentPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const firestore = useFirestore();
  const equipmentQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'equipment'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: equipment, isLoading } = useCollection<Equipment>(equipmentQuery);

  const { toast } = useToast();

  const handleDelete = (item: Equipment) => {
    if (!firestore) return;
    const equipmentRef = doc(firestore, 'equipment', item.id);
    deleteDocumentNonBlocking(equipmentRef);
    toast({
        title: "Equipment Deleted",
        description: `"${item.name}" has been removed from the inventory.`,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle>Equipment Inventory</CardTitle>
          <CardDescription>A central database of all physical assets.</CardDescription>
        </div>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Equipment</DialogTitle>
              <DialogDescription>
                Enter the details of the new asset to add it to the inventory.
              </DialogDescription>
            </DialogHeader>
            <EquipmentForm onFormSubmit={() => setIsNewDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Condition</TableHead>
            <TableHead>Holder</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
            ))}
            {equipment && equipment.length > 0 ? (
            equipment.map((item) => (
                <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="hidden sm:table-cell">{item.category}</TableCell>
                <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className={statusColors[item.status]}>
                        {item.status}
                    </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className={conditionColors[item.condition]}>
                        {item.condition}
                    </Badge>
                </TableCell>
                <TableCell>{item.currentHolder}</TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingEquipment(item)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete "{item.name}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(item)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    </TableCell>
                </TableRow>
            ))
            ) : (
            !isLoading && (
                <TableRow>
                    <TableCell
                    colSpan={6}
                    className="h-48"
                    >
                        <EmptyState 
                            icon={Box}
                            title="No Equipment Here!"
                            description="Your inventory is empty. Add your first asset to get started tracking."
                            className="min-h-0"
                        />
                    </TableCell>
                </TableRow>
            )
            )}
        </TableBody>
        </Table>
      </CardContent>
       <Dialog open={!!editingEquipment} onOpenChange={(open) => !open && setEditingEquipment(null)}>
         <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Edit Equipment</DialogTitle>
                <DialogDescription>Update the details for {editingEquipment ? `"${editingEquipment.name}"` : ''}.</DialogDescription>
            </DialogHeader>
            {editingEquipment && <EquipmentForm equipment={editingEquipment} onFormSubmit={() => setEditingEquipment(null)} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}