'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Partnership } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Handshake, Mail, Phone, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Negotiation": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "Prospecting": "border-blue-500 bg-blue-500/10 text-blue-500",
    "Stalled": "border-red-500 bg-red-500/10 text-red-500",
};

export default function PartnerProfilePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();
  const partnerDocRef = doc(firestore, 'partnerships', id);
  const { data: partner, isLoading } = useDoc<Partnership>(partnerDocRef);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!partner) {
    return (
      <div>
        <Button asChild variant="outline">
          <Link href="/management/partnerships"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Partnerships</Link>
        </Button>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Partner Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested partner could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Button asChild variant="outline">
          <Link href="/management/partnerships"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Partnerships</Link>
       </Button>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <Handshake className="h-7 w-7" /> {partner.name}
                </CardTitle>
                <CardDescription>{partner.type} Partner</CardDescription>
              </div>
              <Badge variant="outline" className={statusColors[partner.status]}>{partner.status}</Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Contact Information</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><p>{partner.contactPerson} ({partner.contactRole || 'Primary Contact'})</p></div>
                        <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${partner.contactEmail}`} className="text-primary hover:underline">{partner.contactEmail}</a></div>
                        {partner.contactPhone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><p>{partner.contactPhone}</p></div>}
                    </div>
                </div>
                 <div className="space-y-4">
                     <h3 className="font-semibold text-lg">Focus Areas</h3>
                     <div className="flex flex-wrap gap-2">
                        {partner.focusAreas?.map(area => <Badge key={area} variant="secondary">{area}</Badge>)}
                     </div>
                </div>
            </div>

            <Separator />

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">What They Offer</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {partner.offers?.map(offer => <li key={offer}>{offer}</li>)}
                    </ul>
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">What We Offer</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {partner.receives?.map(rec => <li key={rec}>{rec}</li>)}
                    </ul>
                </div>
            </div>

             <Separator />

             <div className="space-y-4">
                <h3 className="font-semibold text-lg">Initial Assessment</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Strategic Fit</p>
                        <p className="text-xl font-bold">{partner.strategicFit || 'N/A'}/5</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Resource Potential</p>
                        <p className="text-xl font-bold">{partner.resourcePotential || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Risk Level</p>
                        <p className="text-xl font-bold">{partner.riskLevel || 'N/A'}</p>
                    </div>
                     <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Priority</p>
                        <p className="text-xl font-bold">{partner.priority || 'N/A'}</p>
                    </div>
                </div>
             </div>
             
        </CardContent>
      </Card>
    </div>
  );
}
