
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import type { Partnership } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, PlusCircle, Edit, Trash2 } from 'lucide-react';
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
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Potential": "border-blue-500 bg-blue-500/10 text-blue-500",
    "Inactive": "border-gray-500 bg-gray-500/10 text-gray-500",
};

const partnershipSchema = z.object({
  name: z.string().min(3, "Organization name is required."),
  contactPerson: z.string().min(3, "Contact person is required."),
  contactEmail: z.string().email("Invalid email address."),
  status: z.enum(["Active", "Potential", "Inactive"]),
  nextStep: z.string().min(3, "Next step is required."),
});

type PartnershipFormData = z.infer<typeof partnershipSchema>;


function PartnershipForm({
  partnership,
  onFormSubmit,
}: {
  partnership?: Partnership;
  onFormSubmit: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<PartnershipFormData>({
    resolver: zodResolver(partnershipSchema),
     defaultValues: partnership || {
      status: 'Potential',
    },
  });

  const onSubmit = async (data: z.infer<typeof partnershipSchema>) => {
    if (!firestore) return;

    if (partnership) {
        const partnershipRef = doc(firestore, 'partnerships', partnership.id);
        updateDocumentNonBlocking(partnershipRef, data);
        toast({
            title: "Partnership Updated!",
            description: `${data.name} has been successfully updated.`,
        });
    } else {
        const partnershipsCollection = collection(firestore, 'partnerships');
        const newPartnership = {
          ...data,
          createdAt: serverTimestamp(),
        };
        addDocumentNonBlocking(partnershipsCollection, newPartnership);
        toast({
          title: "Partnership Added!",
          description: `${data.name} has been added to your partner database.`,
        });
    }
    
    reset();
    onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input id="name" {...register("name")} placeholder="e.g., UNICEF" />
        {errors.name && <p className="text-sm text-destructive">{`${errors.name.message}`}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input id="contactPerson" {...register("contactPerson")} placeholder="e.g., Jane Doe" />
          {errors.contactPerson && <p className="text-sm text-destructive">{`${errors.contactPerson.message}`}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input id="contactEmail" type="email" {...register("contactEmail")} placeholder="e.g., jane.doe@example.com" />
          {errors.contactEmail && <p className="text-sm text-destructive">{`${errors.contactEmail.message}`}</p>}
        </div>
      </div>
      <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Potential">Potential</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && <p className="text-sm text-destructive">{`${errors.status.message}`}</p>}
        </div>
      <div className="space-y-2">
        <Label htmlFor="nextStep">Next Step</Label>
        <Input id="nextStep" {...register("nextStep")} placeholder="e.g., Follow up on MoU" />
        {errors.nextStep && <p className="text-sm text-destructive">{`${errors.nextStep.message}`}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (partnership ? 'Saving...' : 'Adding...') : (partnership ? 'Save Changes' : 'Add Partnership')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PartnershipsPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<Partnership | null>(null);

  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: partnerships, isLoading } = useCollection<Partnership>(partnershipsQuery);

  const handleDelete = (partnershipId: string) => {
    if (!firestore) return;
    const partnershipRef = doc(firestore, 'partnerships', partnershipId);
    deleteDocumentNonBlocking(partnershipRef);
    toast({
        title: "Partnership Deleted",
        description: "The partner has been removed from your database.",
    });
  };

  const { toast } = useToast();

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle>Partner Database</CardTitle>
          <CardDescription>A central list of all Omuto Foundation partners.</CardDescription>
        </div>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Partnership
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Partnership</DialogTitle>
              <DialogDescription>
                Enter the details of the new partner organization.
              </DialogDescription>
            </DialogHeader>
            <PartnershipForm onFormSubmit={() => setIsNewDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead className="hidden sm:table-cell">Contact</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Next Step</TableHead>
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
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
            ))}
            {partnerships && partnerships.length > 0 ? (
            partnerships.map((partner) => (
                <TableRow key={partner.id}>
                <TableCell>
                    <div className="font-medium">{partner.name}</div>
                    <div className="text-sm text-muted-foreground sm:hidden">
                        {partner.contactPerson}
                    </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                    <a href={`mailto:${partner.contactEmail}`} className="text-primary hover:underline">
                    {partner.contactPerson}
                    </a>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className={statusColors[partner.status]}>
                    {partner.status}
                    </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{partner.nextStep}</TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingPartnership(partner)}>
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
                                        This action cannot be undone. This will permanently delete the partnership with "{partner.name}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(partner.id)}>Delete</AlertDialogAction>
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
                    colSpan={5}
                    className="h-48"
                    >
                        <EmptyState 
                            icon={Users}
                            title="No Partners Found"
                            description="Your partner database is empty. Add a partner to get started."
                            className="min-h-0"
                        />
                    </TableCell>
                </TableRow>
            )
            )}
        </TableBody>
        </Table>
      </CardContent>
       <Dialog open={!!editingPartnership} onOpenChange={(open) => !open && setEditingPartnership(null)}>
         <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Edit Partnership</DialogTitle>
                <DialogDescription>Update the details for {editingPartnership ? `"${editingPartnership.name}"` : ''}.</DialogDescription>
            </DialogHeader>
            {editingPartnership && <PartnershipForm partnership={editingPartnership} onFormSubmit={() => setEditingPartnership(null)} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
