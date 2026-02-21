
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

// Filter mock data to only include schools
const mockSchoolPartnerships: Partnership[] = [
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
        programs: ["Green Schools", "OFA"],
        championTeacher: "Ms. Alice Brown",
        championTeacherContact: "+256 780 987654",
      },
      focusAreas: ["Education"],
      offers: ["Classrooms", "Students for programs"],
      receives: ["Educational materials", "Teacher training"],
    },
    {
        id: "p4",
        name: "Kiwatule Secondary School",
        type: "School",
        contactPerson: "Ms. Stella Nsubuga",
        contactEmail: "info@kiwatulesec.ac.ug",
        status: "Active",
        nextStep: "Plan next term's OFA activities",
        nextActionDate: new Date(2026, 3, 1).toISOString(),
        createdAt: new Date(2025, 5, 10).toISOString(),
        lastContacted: new Date(2026, 1, 15).toISOString(),
        schoolDetails: {
          headTeacher: "Ms. Stella Nsubuga",
          studentPopulation: 1200,
          level: "Secondary",
          programs: ["OFA"],
          championTeacher: "Mr. Peter Kasirye",
          championTeacherContact: "+256 777 112233",
        },
        focusAreas: ["Education", "Youth Development"],
        offers: ["Assembly space", "Student participation"],
        receives: ["Mentorship", "Sports equipment"],
      },
      {
        id: "p5",
        name: "Bright Future Vocational Institute",
        type: "School",
        contactPerson: "Dr. Grace Namara",
        contactEmail: "principal@brightfuture.edu",
        status: "Prospecting",
        nextStep: "Initial meeting to discuss vocational training partnership",
        nextActionDate: new Date(2026, 2, 20).toISOString(),
        createdAt: new Date(2026, 0, 25).toISOString(),
        lastContacted: new Date(2026, 1, 5).toISOString(),
        schoolDetails: {
          headTeacher: "Dr. Grace Namara",
          studentPopulation: 300,
          level: "Vocational",
          programs: [],
          championTeacher: undefined,
          championTeacherContact: undefined,
        },
        focusAreas: ["Vocational Training", "Skills Development"],
        offers: ["Workshop facilities"],
        receives: ["Curriculum development support"],
      }
];


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
  // In a real application, fetch data from an API or context, filtered by type === 'School'
  const schoolPartnerships = mockSchoolPartnerships; // Using mock data for now

  return (
    <div className="rounded-md border">
      <DataTable columns={schoolColumns} data={schoolPartnerships} />
    </div>
  );
}
