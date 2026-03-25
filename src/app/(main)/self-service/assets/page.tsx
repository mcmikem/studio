'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  Package, Laptop, Bike, Smartphone, 
  MapPin, Clock, ShieldCheck, 
  ArrowRight, AlertTriangle, HelpCircle,
  FileText, Zap, CheckCircle2
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where } from 'firebase/firestore';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyAssetsPage() {
  const { user } = useUser();
  
  const assetsQuery = useMemoFirebase((db) => {
    if (!user) return null;
    return query(
      collection(db, 'assets'),
      where('assignedTo', '==', user.uid)
    );
  }, [user]);

  const { data: myAssets, isLoading } = useCollection<any>(assetsQuery);

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="My Assets"
        description="View and manage organizational equipment assigned to you for your mission."
        icon={Package}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 border-b bg-muted/30">
                  <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Currently Assigned</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Official equipment in your possession</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-8 space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
                  ) : myAssets && myAssets.length > 0 ? (
                    <div className="divide-y divide-omuto-navy/5">
                      {myAssets.map((asset: any) => (
                        <div key={asset.id} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-white border-2 border-primary/5 shadow-sm flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                    {asset.type === 'electronics' ? <Laptop className="h-7 w-7" /> : asset.type === 'vehicle' ? <Bike className="h-7 w-7" /> : <Package className="h-7 w-7" />}
                                </div>
                                <div>
                                    <p className="text-lg font-black text-omuto-navy tracking-tight uppercase">{asset.name}</p>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                        <span className="text-primary">{asset.tag}</span>
                                        <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                                        <span>Assigned {formatDateSafe(asset.assignedAt, 'dateOnly')}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px] border-2">
                                Report Issue
                            </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center">
                         <Package className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                         <p className="text-sm font-bold text-omuto-navy/40 uppercase tracking-widest">No assets currently assigned to you.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Asset Responsibilities */}
              <Card className="border-2 border-omuto-navy/10 bg-omuto-navy/5 rounded-[2.5rem] p-8">
                  <h4 className="text-sm font-black text-omuto-navy uppercase tracking-tight mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" /> Custodian Responsibility
                  </h4>
                  <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground font-medium">Keep assets secure and clean at all times.</p>
                      </li>
                      <li className="flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground font-medium">Reporting faults within 24 hours of discovery.</p>
                      </li>
                      <li className="flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground font-medium">Return equipment in original condition upon end of mission.</p>
                      </li>
                  </ul>
              </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden p-8 bg-white border-primary/10">
                  <div className="flex flex-col items-center text-center">
                      <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                          <HelpCircle className="h-8 w-8" />
                      </div>
                      <h4 className="text-sm font-black text-omuto-navy uppercase tracking-tight mb-2">Need New Equipment?</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed mb-6">
                          Contact the Operations Desk to request additional assets for your field work.
                      </p>
                      <Button className="w-full h-12 rounded-xl bg-omuto-navy text-white font-black uppercase tracking-widest text-[9px] hover:bg-primary">
                          Request Upgrade
                      </Button>
                  </div>
              </Card>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden p-8 border-dashed">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                          <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-rose-600 uppercase tracking-tight">Maintenance Alert</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 leading-relaxed">
                              Your workstation audit is due in 3 days. Please ensure all tags are visible.
                          </p>
                      </div>
                  </div>
              </Card>
          </div>
      </div>
    </div>
  );
}



function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
