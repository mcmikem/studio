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
import { Users, Download, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Parser } from 'json2csv';
import { useToast } from '@/hooks/use-toast';

export default function BeneficiariesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'beneficiaries'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore]);

  const { data: beneficiaries, isLoading } = useCollection<Beneficiary>(beneficiariesQuery);

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
    <div className="space-y-10 pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
             <div className="p-3 bg-white border-lg border-omuto-navy shadow-comic-sm rounded-2xl rotate-[-2deg]">
                <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="font-heading text-4xl font-black tracking-tight leading-none uppercase text-omuto-navy">
                    Beneficiary <span className="text-omuto-red underline decoration-4 underline-offset-4">Registry</span>
                </h1>
                <p className="text-omuto-navy/60 font-bold uppercase text-[10px] tracking-widest mt-1">Central Participant Database</p>
            </div>
        </div>
        <Button onClick={handleExportCSV} disabled={!beneficiaries || beneficiaries.length === 0} className="btn-omuto btn-omuto-secondary">
            <Download className="mr-2 h-4 w-4" />
            EXPORT DATA
        </Button>
      </header>

      {/* Mobile View */}
      <div className="sm:hidden space-y-4">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {beneficiaries?.map(b => (
            <Card key={b.id}>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12 border-md border-omuto-navy shadow-comic-sm">
                        <AvatarImage src={b.photoURL || ''} alt={b.name} />
                        <AvatarFallback className="bg-omuto-cream text-omuto-navy font-black text-xs">{getInitials(b.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-base">{b.name}</CardTitle>
                        <CardDescription>{b.programEnrolled}</CardDescription>
                    </div>
                </CardHeader>
                 <CardContent className="text-sm">
                    <p><strong>Village:</strong> {b.village}</p>
                    <p><strong>Gender:</strong> {b.gender}</p>
                 </CardContent>
            </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <Card className="data-table-omuto">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70 pl-6">Participant Details</TableHead>
                  <TableHead className="hidden md:table-cell font-black uppercase text-[10px] tracking-widest text-omuto-navy/70">Enrolled Program</TableHead>
                  <TableHead className="hidden sm:table-cell font-black uppercase text-[10px] tracking-widest text-omuto-navy/70">Location</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/70 pr-6 text-right">Gender</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6"><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                {beneficiaries && beneficiaries.length > 0 ? (
                  beneficiaries.map((beneficiary) => (
                    <TableRow key={beneficiary.id} className="group">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-md border-omuto-navy shadow-comic-sm group-hover:rotate-3 transition-transform">
                            <AvatarImage src={beneficiary.photoURL || ''} alt={beneficiary.name} />
                            <AvatarFallback className="bg-omuto-cream text-omuto-navy font-black text-xs">{getInitials(beneficiary.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-black text-sm uppercase leading-tight text-omuto-navy">{beneficiary.name}</p>
                            <p className="text-[10px] font-bold text-omuto-navy/40 uppercase tracking-tight">{beneficiary.phone || 'NO CONTACT RECORDED'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                          <span className="px-3 py-1 bg-omuto-cream border-px border-omuto-navy/10 rounded-full text-[10px] font-black uppercase tracking-wide text-omuto-navy/70">{beneficiary.programEnrolled}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-bold text-xs text-omuto-navy/70 uppercase">{beneficiary.village}</TableCell>
                      <TableCell className="pr-6 text-right font-black text-xs text-omuto-navy">{beneficiary.gender}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-64"
                      >
                        <EmptyState
                          icon={Users}
                          title="No Beneficiaries Registered"
                          description="Start by registering the first participant to activate this database."
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
    </div>
  );
}
