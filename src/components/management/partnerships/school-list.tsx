
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
import { Partnership } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";

export const schoolColumns: ColumnDef<Partnership>[] = [
  {
    accessorKey: "name",
    header: "School Name",
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
      const { toast } = useToast();

      const handleEdit = () => {
        toast({
          title: "Edit School Partnership",
          description: `Editing ${partnership.name} (ID: ${partnership.id})`,
        });
        // Implement actual edit logic
      };

      const handleDelete = () => {
        toast({
          title: "Delete School Partnership",
          description: `Deleting ${partnership.name} (ID: ${partnership.id})`,
          variant: "destructive",
        });
        // Implement actual delete logic
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(partnership.id)}>
              Copy partnership ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
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
    <div className="rounded-md border">
      <DataTable columns={schoolColumns} data={schoolPartnerships || []} />
    </div>
  );
}
