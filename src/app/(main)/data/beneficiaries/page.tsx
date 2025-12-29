
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Beneficiary } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateSafe } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

export default function BeneficiariesPage() {
  const firestore = useFirestore();
  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'beneficiaries'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: beneficiaries, isLoading } = useCollection<Beneficiary>(beneficiariesQuery);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          Beneficiary Database
        </h1>
        <p className="text-muted-foreground">
          A central directory of all registered program beneficiaries.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Program</TableHead>
                <TableHead className="hidden sm:table-cell">Location</TableHead>
                <TableHead className="hidden md:table-cell">Date of Birth</TableHead>
                <TableHead>Gender</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))}
              {beneficiaries && beneficiaries.length > 0 ? (
                beneficiaries.map((beneficiary) => (
                  <TableRow key={beneficiary.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                          <AvatarImage src={beneficiary.photoURL || ''} alt={beneficiary.name} />
                          <AvatarFallback>{getInitials(beneficiary.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{beneficiary.name}</p>
                          <p className="text-sm text-muted-foreground">{beneficiary.phone || 'No contact'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{beneficiary.programEnrolled}</TableCell>
                    <TableCell className="hidden sm:table-cell">{beneficiary.village}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDateSafe(beneficiary.dob, 'dateOnly')}</TableCell>
                    <TableCell>{beneficiary.gender}</TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-48"
                    >
                      <EmptyState
                        icon={Users}
                        title="No Beneficiaries Registered"
                        description="Register your first beneficiary using the forms in the MEAL Hub."
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
