
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { type ColumnDef } from "@tanstack/react-table";
import type { OFATeam } from '@/lib/types';
import { Swords, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TeamsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const { profile: userProfile } = useUserProfile(user);
  
  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-teams'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: teams, isLoading } = useCollection<OFATeam>(teamsQuery);

  const columns: ColumnDef<OFATeam>[] = [
    {
      accessorKey: "teamName",
      header: "Team Name",
      cell: ({ row }) => <span className="font-medium">{row.original.teamName}</span>
    },
    {
      accessorKey: "subcounty",
      header: "Location",
    },
    {
      accessorKey: "headCoachName",
      header: "Coach",
      cell: ({ row }) => row.original.headCoachName || 'N/A'
    },
    {
      accessorKey: "totalPlayers",
      header: "Players",
      cell: ({ row }) => row.original.totalPlayers || 0
    }
  ];

  return (
    <>
    <div className="space-y-6">
       <header>
            <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
            <Swords className="h-8 w-8" />
            Registered OFA Teams
            </h1>
            <p className="text-muted-foreground">
            A directory of all teams participating in the Omuto Football Alliance.
            </p>
      </header>
      <Card>
        <CardContent className="pt-6">
            <DataTable
                columns={columns}
                data={teams || []}
                isLoading={isLoading}
                currentUser={user}
                userProfile={userProfile}
                editHref={(team: OFATeam) => `/meal/ofa/team-registration?id=${team.id}`}
                viewHref={(team: OFATeam) => `/meal/data/ofa/teams/${team.id}`}
                deleteCollection="ofa-teams"
                renderMobileCard={(team: OFATeam) => (
                    <Card key={team.id}>
                        <CardHeader>
                            <CardTitle>{team.teamName}</CardTitle>
                            <CardDescription>{team.subcounty}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p><strong>Coach:</strong> {team.headCoachName || 'N/A'}</p>
                            <p><strong>Players:</strong> {team.totalPlayers || 0}</p>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                             <Button asChild variant="secondary" className="w-full">
                                <Link href={`/meal/data/ofa/teams/${team.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            />
        </CardContent>
      </Card>
    </div>
   </>
  );
}
