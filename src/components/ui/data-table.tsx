
"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "./skeleton"
import React from "react"
import { MoreHorizontal, Edit, Trash2, Eye, Search } from "lucide-react"
import { Button } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./alert-dialog"
import { canEdit, canDelete } from "@/lib/permissions"
import type { User as AuthUser } from "firebase/auth"
import type { User as UserProfile } from "@/lib/types/user"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { useFirestore } from "@/firebase"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  isLoading?: boolean;
  renderMobileCard?: (item: TData) => React.ReactNode;

  // Permission Props
  currentUser?: AuthUser | null;
  userProfile?: UserProfile | null;

  // Action Actions
  editHref?: (item: TData) => string;
  viewHref?: (item: TData) => string;
  deleteCollection?: string;
  onDeleteSuccess?: (item: TData) => void;

  // Empty state
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; href?: string; onClick?: () => void };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  renderMobileCard,
  currentUser,
  userProfile,
  editHref,
  viewHref,
  deleteCollection,
  onDeleteSuccess,
  emptyTitle = "No records found",
  emptyDescription = "There are no items to display right now.",
  emptyAction,
}: DataTableProps<TData, TValue>) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = async (item: any) => {
    if (!firestore || !deleteCollection || !item.id) return;
    try {
        await deleteDocumentNonBlocking(doc(firestore, deleteCollection, item.id));
        toast({ title: "Deleted Successfully" });
        onDeleteSuccess?.(item);
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Delete Failed", description: e.message || "Permission denied." });
    }
  };

  const actionsColumn: ColumnDef<TData> = {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original as any;
      const editable = editHref && canEdit(item, currentUser || null);
      const deletable = deleteCollection && canDelete(userProfile || null);

      if (!editable && !deletable && !viewHref) return null;

      return (
        <div className="flex justify-end gap-1">
          {viewHref && (
            <Button variant="ghost" size="icon" asChild>
                <Link href={viewHref(item)}><Eye className="h-4 w-4" /></Link>
            </Button>
          )}
          {editable && (
            <Button variant="ghost" size="icon" asChild>
                <Link href={editHref(item)}><Edit className="h-4 w-4" /></Link>
            </Button>
          )}
          {deletable && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the record.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(item)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      );
    },
  };

  const finalColumns = React.useMemo(() => {
    if (editHref || deleteCollection || viewHref) {
        return [...columns, actionsColumn];
    }
    return columns;
  }, [columns, editHref, deleteCollection, viewHref]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      {/* Desktop View */}
      <div className={renderMobileCard ? "hidden md:block rounded-md border" : "rounded-md border"}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>
                      {columns.map((col, j) => (
                           <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                  </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">{emptyTitle}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{emptyDescription}</p>
                    {emptyAction && (
                      emptyAction.href ? (
                        <Button variant="outline" size="sm" className="mt-3" asChild>
                          <Link href={emptyAction.href}>{emptyAction.label}</Link>
                        </Button>
                      ) : emptyAction.onClick ? (
                        <Button variant="outline" size="sm" className="mt-3" onClick={emptyAction.onClick}>
                          {emptyAction.label}
                        </Button>
                      ) : null
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      {renderMobileCard && (
          <div className="md:hidden space-y-4">
              {isLoading ? (
                  Array.from({length: 3}).map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-xl" />
                  ))
              ) : data.length > 0 ? (
                  data.map((item, i) => (
                      <React.Fragment key={i}>
                          {renderMobileCard(item)}
                      </React.Fragment>
                  ))
              ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-2xl">
                      <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">{emptyTitle}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{emptyDescription}</p>
                      {emptyAction && (
                        emptyAction.href ? (
                          <Button variant="outline" size="sm" className="mt-3" asChild>
                            <Link href={emptyAction.href}>{emptyAction.label}</Link>
                          </Button>
                        ) : emptyAction.onClick ? (
                          <Button variant="outline" size="sm" className="mt-3" onClick={emptyAction.onClick}>
                            {emptyAction.label}
                          </Button>
                        ) : null
                      )}
                  </div>
              )}
          </div>
      )}
    </div>
  )
}
