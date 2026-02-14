
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { type Partnership } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Negotiation": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "Prospecting": "border-blue-500 bg-blue-500/10 text-blue-500",
    "Stalled": "border-red-500 bg-red-500/10 text-red-500",
    "Terminated": "border-gray-500 bg-gray-500/10 text-gray-500",
};


export const schoolColumns: ColumnDef<Partnership>[] = [
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
      const { toast } = useToast();

      const handleEdit = () => {
        toast({
          title: "Edit School Partnership",
          description: `Editing ${partnership.name} (ID: ${partnership.id})`,
        });
      };

      const handleDelete = () => {
        toast({
          title: "Delete School Partnership",
          description: `Deleting ${partnership.name} (ID: ${partnership.id})`,
          variant: "destructive",
        });
      };

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
             <DropdownMenuItem asChild>
                <Link href={`/management/partnerships/${partnership.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function SchoolList() {
    const firestore = useFirestore();
    const schoolsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'partnerships'), where('type', '==', 'School'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: schoolPartnerships, isLoading } = useCollection<Partnership>(schoolsQuery);

  return (
    <DataTable columns={schoolColumns} data={schoolPartnerships || []} isLoading={isLoading} />
  );
}
