
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { DataTable } from "@/components/ui/data-table";
import { type Partnership } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Negotiation": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "Prospecting": "border-blue-500 bg-blue-500/10 text-blue-500",
    "Stalled": "border-red-500 bg-red-500/10 text-red-500",
    "Terminated": "border-gray-500 bg-gray-500/10 text-gray-500",
};

interface SchoolListProps {
    onEdit: (partner: Partnership) => void;
}

export function SchoolList({ onEdit }: SchoolListProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const schoolsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'partnerships'), where('type', '==', 'School'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: schoolPartnerships, isLoading } = useCollection<Partnership>(schoolsQuery);

     const handleDelete = async (partnerId: string, partnerName: string) => {
        if (!firestore) return;
        try {
            await deleteDocumentNonBlocking(doc(firestore, 'partnerships', partnerId));
            toast({
                title: "Partner Deleted",
                description: `${partnerName} has been removed from your list.`
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not delete the partner. Please try again."
            });
        }
    }

    const schoolColumns: ColumnDef<Partnership>[] = [
      {
        accessorKey: "name",
        header: "School Name",
         cell: ({ row }) => (
            <Link href={`/management/partnerships/${row.original.id}`} className="font-medium text-primary hover:underline">
                {row.getValue("name")}
            </Link>
        )
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return <Badge variant="outline" className={statusColors[status]}>{status}</Badge>
        }
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
                <DropdownMenuItem onSelect={() => onEdit(partnership)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the partnership record for <strong>{partnership.name}</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(partnership.id, partnership.name)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];

    return (
        <DataTable columns={schoolColumns} data={schoolPartnerships || []} isLoading={isLoading} />
    );
}
