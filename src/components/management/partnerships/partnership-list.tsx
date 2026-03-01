
"use client";

import { useMemo } from "react";
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
import { useFirestore, deleteDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";
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
} from "@/components/ui/alert-dialog";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateSafe } from "@/lib/utils";

interface PartnershipListProps {
    partnerships: Partnership[] | null;
    isLoading: boolean;
    onEdit: (partner: Partnership) => void;
}

function PartnershipCard({ partnership, onEdit, onDelete }: { partnership: Partnership, onEdit: (p: Partnership) => void, onDelete: (p: Partnership) => void }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base">
                        <Link href={`/management/partnerships/${partnership.id}`} className="hover:underline">{partnership.name}</Link>
                    </CardTitle>
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
                            <DropdownMenuSeparator />
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{partnership.name}".</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(partnership)}>Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardDescription>{partnership.type}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                 <p><span className="font-semibold">Contact:</span> {partnership.contactPerson}</p>
                 <p><span className="font-semibold">Status:</span> <Badge variant="outline">{partnership.status}</Badge></p>
                 <p><span className="font-semibold">Next Step:</span> {partnership.nextStep}</p>
                 {partnership.nextActionDate && <p className="text-xs text-muted-foreground">Due: {formatDateSafe(partnership.nextActionDate, 'dateOnly')}</p>}
            </CardContent>
        </Card>
    )
}

export function PartnershipList({ partnerships, isLoading, onEdit }: PartnershipListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (partnership: Partnership) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'partnerships', partnership.id);
    deleteDocumentNonBlocking(docRef);
    toast({ variant: 'destructive', title: `Deleted ${partnership.name}` });
  };
  
  const columns: ColumnDef<Partnership>[] = [
    {
        accessorKey: "name",
        header: "Partner Name",
        cell: ({ row }) => <Link href={`/management/partnerships/${row.original.id}`} className="font-medium text-primary hover:underline">{row.original.name}</Link>
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
                ({formatDateSafe(partnership.nextActionDate as any, 'dateOnly')})
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
                <DropdownMenuSeparator />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{partnership.name}".</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(partnership)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
            </DropdownMenu>
        );
        },
    },
    ];

  return (
    <>
    {/* Mobile View */}
    <div className="sm:hidden space-y-4">
        {partnerships?.map(p => (
            <PartnershipCard key={p.id} partnership={p} onEdit={onEdit} onDelete={handleDelete} />
        ))}
    </div>
    {/* Desktop View */}
    <div className="hidden sm:block rounded-md border">
      <DataTable columns={columns} data={partnerships || []} isLoading={isLoading} />
    </div>
    </>
  );
}
