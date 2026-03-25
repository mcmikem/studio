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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import type { OFAPlayer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Trash2, Edit, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { DataTable } from '@/components/ui/data-table';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getInitials } from '@/lib/utils';
import { type ColumnDef } from "@tanstack/react-table";

export default function PlayersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const { profile: userProfile } = useUserProfile(user);

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ofa-players'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);
  const { data: players, isLoading } = useCollection<OFAPlayer>(playersQuery);

  const columns: ColumnDef<OFAPlayer>[] = [
    {
      accessorKey: "name",
      header: "Player",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={(row.original as any).photoUrl || ''} />
            <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.name}</span>
        </div>
      )
    },
    {
      accessorKey: "teamName",
      header: "Team",
    },
    {
      accessorKey: "ageCategory",
      header: "Age",
      cell: ({ row }) => <Badge variant="outline">{row.original.ageCategory}</Badge>
    },
    {
        accessorKey: "school",
        header: "School",
    }
  ];

  const handleDelete = (player: OFAPlayer) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'ofa-players', player.id))
      .then(() => {
        toast({ title: "Player Deleted", description: `${player.name} has been removed from the database.` });
      })
      .catch((err) => {
        toast({ variant: 'destructive', title: "Error", description: "Could not delete player. Check permissions." });
        console.error(err);
      });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          OFA Player Database
        </h1>
        <p className="text-muted-foreground">
          A central directory of all registered OFA players.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
            <DataTable
                columns={columns}
                data={players || []}
                isLoading={isLoading}
                currentUser={user}
                userProfile={userProfile}
                editHref={(player) => `/meal/ofa/player-registration?id=${player.id}`}
                viewHref={(player) => `/meal/data/ofa/players/${player.id}`}
                deleteCollection="ofa-players"
                renderMobileCard={(player) => (
                    <Card key={player.id}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={(player as any).photoUrl || ''} />
                                <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-base">{player.name}</CardTitle>
                                <CardDescription>{(player as any).teamName} &bull; {player.ageCategory}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardFooter>
                            <Button asChild variant="secondary" className="w-full">
                                <Link href={`/meal/data/ofa/players/${player.id}`}>View Profile <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            />
        </CardContent>
      </Card>
    </div>
  );
}
