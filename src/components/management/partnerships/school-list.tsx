"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { Partnership } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { deleteDocumentNonBlocking, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SchoolListProps {
  onEdit: (partner: Partnership) => void;
}

function DeleteSchoolPartnershipAction({ partnership, firestore }: { partnership: Partnership; firestore: ReturnType<typeof useFirestore> }) {
  const handleDelete = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database unavailable', description: 'Please try again.' });
      return;
    }

    try {
      await deleteDocumentNonBlocking(doc(firestore, 'partnerships', partnership.id));
      toast({ title: 'Partnership deleted', description: `${partnership.name} has been removed.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error?.message || 'Could not delete partnership.' });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete school partnership?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove <strong>{partnership.name}</strong> from partnerships.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SchoolCard({ partnership, onEdit, firestore }: { partnership: Partnership; onEdit: (p: Partnership) => void; firestore: ReturnType<typeof useFirestore> }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">
            <Link href={`/management/partnerships/${partnership.id}`} className="hover:underline">{partnership.name}</Link>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(partnership)}>Edit</DropdownMenuItem>
              <DeleteSchoolPartnershipAction partnership={partnership} firestore={firestore} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>{partnership.schoolDetails?.level || "N/A"}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <p><span className="font-semibold">Head Teacher:</span> {partnership.schoolDetails?.headTeacher || "N/A"}</p>
        <p><span className="font-semibold">Champion Teacher:</span> {partnership.schoolDetails?.championTeacher || "N/A"}</p>
        <p><span className="font-semibold">Population:</span> {partnership.schoolDetails?.studentPopulation || "N/A"}</p>
        <p><span className="font-semibold">Status:</span> <Badge variant="outline">{partnership.status}</Badge></p>
      </CardContent>
    </Card>
  )
}

export function SchoolList({ onEdit }: SchoolListProps) {
  const firestore = useFirestore();

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partnerships'), where('type', '==', 'School'), orderBy('name'));
  }, [firestore]);

  const { data: schoolPartnerships, isLoading } = useCollection<Partnership>(schoolsQuery);

  const schoolColumns: ColumnDef<Partnership>[] = [
    {
      accessorKey: "name",
      header: "School Name",
      cell: ({ row }) => <Link href={`/management/partnerships/${row.original.id}`} className="font-medium text-primary hover:underline">{row.original.name}</Link>
    },
    {
      accessorKey: "schoolDetails.headTeacher",
      header: "Head Teacher",
      cell: ({ row }) => row.original.schoolDetails?.headTeacher || "N/A",
    },
    {
      accessorKey: "schoolDetails.level",
      header: "Level",
      cell: ({ row }) => row.original.schoolDetails?.level || "N/A",
    },
    {
      accessorKey: "schoolDetails.studentPopulation",
      header: "Population",
      cell: ({ row }) => row.original.schoolDetails?.studentPopulation || "N/A",
    },
    {
      accessorKey: "schoolDetails.programs",
      header: "Programs",
      cell: ({ row }) => {
        const programs = row.original.schoolDetails?.programs;
        return programs && programs.length > 0 ? programs.join(", ") : "None";
      },
    },
    {
      accessorKey: "schoolDetails.championTeacher",
      header: "Champion Teacher",
      cell: ({ row }) => row.original.schoolDetails?.championTeacher || "N/A",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const partnership = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(partnership)}>Edit</DropdownMenuItem>
              <DeleteSchoolPartnershipAction partnership={partnership} firestore={firestore} />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="sm:hidden space-y-4">
        {schoolPartnerships?.map(p => (
          <SchoolCard key={p.id} partnership={p} onEdit={onEdit} firestore={firestore} />
        ))}
      </div>
      <div className="hidden sm:block rounded-md border">
        <DataTable columns={schoolColumns} data={schoolPartnerships || []} isLoading={isLoading} />
      </div>
    </>
  );
}
