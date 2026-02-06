
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
import { collection, query, orderBy } from "firebase/firestore";

export const columns: ColumnDef<Partnership>[] = [
  {
    accessorKey: "name",
    header: "Partner Name",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "contactPerson",
    header: "Contact Person",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "nextStep",
    header: "Next Step",
    cell: ({ row }) => {
      const partnership = row.original;
      return (
        <div className="flex flex-col">
          <span>{partnership.nextStep}</span>
          {partnership.nextActionDate && (
            <span className="text-sm text-muted-foreground">
              ({new Date(partnership.nextActionDate as any).toLocaleDateString()})
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const partnership = row.original;
      const { toast } = useToast();

      const handleEdit = () => {
        toast({
          title: "Edit Partnership",
          description: `Editing ${partnership.name} (ID: ${partnership.id})`,
        });
      };

      const handleDelete = () => {
        toast({
          title: "Delete Partnership",
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

export function PartnershipList() {
    const firestore = useFirestore();
    const partnershipsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: partnerships, isLoading } = useCollection<Partnership>(partnershipsQuery);

  return (
    <div className="rounded-md border">
      <DataTable columns={columns} data={partnerships || []} />
    </div>
  );
}
