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
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Beneficiary } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Download, ArrowRight, User, MapPin, Calendar, Phone } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Parser } from 'json2csv';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { useUserProfile } from '@/hooks/use-user-profile';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function BeneficiariesPage() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'beneficiaries'), orderBy('createdAt', 'desc'), limit(500));
  }, [firestore]);

  const { data: beneficiaries, isLoading } = useCollection<Beneficiary>(beneficiariesQuery);

  const columns = [
    {
      header: 'Participant',
      accessorKey: 'name',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border shadow-sm">
            <AvatarImage src={row.original.photoURL || ''} alt={row.original.name} />
            <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-sm uppercase tracking-tight">{row.original.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Phone className="h-2 w-2" /> {row.original.phone || 'No Contact'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Program',
      accessorKey: 'programEnrolled',
      cell: ({ row }: { row: any }) => (
        <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest bg-primary/5 text-primary border-primary/10">
          {row.original.programEnrolled}
        </Badge>
      )
    },
    {
       header: 'Location',
       cell: ({ row }: { row: any }) => (
         <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold">
            <MapPin className="h-3 w-3" />
            <span>{row.original.village || row.original.subcounty}</span>
         </div>
       )
    },
    {
       header: 'Gender',
       accessorKey: 'gender',
       cell: ({ row }: { row: any }) => (
         <span className="text-xs font-black uppercase text-muted-foreground">{row.original.gender}</span>
       )
    },
    {
       header: 'Registered',
       cell: ({ row }: { row: any }) => (
         <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-medium">
            <Calendar className="h-3 w-3" />
            <span>{formatDateSafe(row.original.createdAt, 'dateOnly')}</span>
         </div>
       )
    }
  ];

  const handleExportCSV = () => {
    if (!beneficiaries || beneficiaries.length === 0) return;

    try {
        const fields = ['name', 'phone', 'programEnrolled', 'village', 'gender', 'dob', 'school', 'guardianContact'];
        const parser = new Parser({ fields });
        const csv = parser.parse(beneficiaries);
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `beneficiaries_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
            title: "Export Successful",
            description: `${beneficiaries.length} beneficiaries exported to CSV.`,
        });
    } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "An error occurred while generating the CSV.",
        });
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
             <div className="p-3 bg-white border-lg border-primary/20 shadow-comic-sm rounded-2xl">
                <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="font-heading text-4xl font-black tracking-tight leading-none uppercase text-primary">
                    Beneficiary <span className="underline decoration-4 underline-offset-4">Registry</span>
                </h1>
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">Central Participant Database</p>
            </div>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" asChild>
                <Link href="/meal/beneficiary-registration"><User className="mr-2 h-4 w-4" />NEW REGISTRATION</Link>
            </Button>
            <Button onClick={handleExportCSV} disabled={!beneficiaries || beneficiaries.length === 0} className="btn-omuto btn-omuto-secondary">
                <Download className="mr-2 h-4 w-4" />
                EXPORT CSV
            </Button>
        </div>
      </header>

      <DataTable 
        columns={columns}
        data={beneficiaries || []}
        isLoading={isLoading}
        currentUser={user}
        userProfile={profile}
        editHref={(b: Beneficiary) => `/meal/beneficiary-registration?id=${b.id}`}
        deleteCollection="beneficiaries"
      />
    </div>
  );
}
