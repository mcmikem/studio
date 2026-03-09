
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  isLoading?: boolean;
  renderMobileCard?: (item: TData) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  renderMobileCard,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      {/* Desktop View */}
      <div className={renderMobileCard ? "hidden sm:block rounded-md border" : "rounded-md border"}>
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      {renderMobileCard && (
          <div className="sm:hidden space-y-4">
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
                  <div className="text-center py-8 text-muted-foreground border rounded-xl border-dashed">
                      No results.
                  </div>
              )}
          </div>
      )}
    </div>
  )
}
