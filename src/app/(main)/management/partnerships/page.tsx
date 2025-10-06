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
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import type { Partnership } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, PlusCircle } from 'lucide-react';
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


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

function NewPartnershipForm({ onFormSubmit }: { onFormSubmit: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(partnershipSchema),
     defaultValues: {
      status: 'Potential',
    },
  });

  const onSubmit = async (data: z.infer<typeof partnershipSchema>) => {
    if (!firestore) return;
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
      <div className="grid grid-cols-2 gap-4">
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
            {isSubmitting ? 'Adding...' : 'Add Partnership'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PartnershipsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: partnerships, isLoading } = useCollection<Partnership>(partnershipsQuery);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Partner Database</CardTitle>
            <CardDescription>A central list of all Omuto Foundation partners.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <NewPartnershipForm onFormSubmit={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Step</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                  </TableRow>
                ))}
              {partnerships && partnerships.length > 0 ? (
                partnerships.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.contactPerson}</TableCell>
                    <TableCell>
                      <a href={`mailto:${partner.contactEmail}`} className="text-primary hover:underline">
                        {partner.contactEmail}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[partner.status]}>
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.nextStep}</TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                    <TableRow>
                        <TableCell
                        colSpan={5}
                        className="h-48 text-center text-muted-foreground"
                        >
                            <div className="flex flex-col items-center justify-center gap-2">
                                <Users className="h-12 w-12" />
                                <span className="text-lg font-semibold">No Partners Found</span>
                                <p className="text-sm">Your partner database is empty. Add a partner to get started.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    