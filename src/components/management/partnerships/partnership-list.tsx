
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
import { DataTable } from "@/components/ui/data-table"; // Assuming you have a generic DataTable component
import { Partnership } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockPartnerships: Partnership[] = [
  {
    id: "p1",
    name: "Green Earth NGO",
    type: "NGO",
    contactPerson: "Jane Doe",
    contactEmail: "jane.doe@greenearth.org",
    status: "Active",
    nextStep: "Review annual report",
    nextActionDate: new Date(2026, 2, 10).toISOString(),
    createdAt: new Date(2025, 0, 15).toISOString(),
    lastContacted: new Date(2026, 1, 28).toISOString(),
    focusAreas: ["Environment", "Education"],
    offers: ["Volunteers", "Expertise"],
    receives: ["Funding", "Access to schools"],
  },
  {
    id: "p2",
    name: "St. Mary's Primary School",
    type: "School",
    contactPerson: "Mr. John Smith",
    contactEmail: "headteacher@stmarys.org",
    status: "Negotiation",
    nextStep: "Finalize MoU for Green Schools program",
    nextActionDate: new Date(2026, 2, 5).toISOString(),
    createdAt: new Date(2025, 10, 1).toISOString(),
    lastContacted: new Date(2026, 1, 20).toISOString(),
    schoolDetails: {
      headTeacher: "Mr. John Smith",
      studentPopulation: 450,
      level: "Primary",
      programs: ["Green Schools"],
      championTeacher: "Ms. Alice Brown",
    },
    focusAreas: ["Education"],
  },
  {
    id: "p3",
    name: "Ministry of Education",
    type: "Government",
    contactPerson: "Hon. David Mutebi",
    contactEmail: "info@moes.gov.ug",
    status: "Prospecting",
    nextStep: "Initial meeting to discuss potential collaboration",
    nextActionDate: new Date(2026, 2, 15).toISOString(),
    createdAt: new Date(2026, 0, 5).toISOString(),
    lastContacted: new Date(2026, 0, 20).toISOString(),
    focusAreas: ["Policy", "Education"],
  },
];

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
              ({new Date(partnership.nextActionDate).toLocaleDateString()})
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

      const handleEdit = () => {
        toast({
          title: "Edit Partnership",
          description: `Editing ${partnership.name} (ID: ${partnership.id})`,
        });
        // Implement actual edit logic, e.g., open a dialog with the form
      };

      const handleDelete = () => {
        toast({
          title: "Delete Partnership",
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

export function PartnershipList() {
  // In a real application, fetch data from an API or context
  const partnerships = mockPartnerships; // Using mock data for now

  return (
    <div className="rounded-md border">
      <DataTable columns={columns} data={partnerships} />
    </div>
  );
}
