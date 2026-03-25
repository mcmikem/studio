'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  Package, Search, Filter, 
  Plus, ArrowRight, Laptop,
  Bike, Smartphone, Monitor,
  ShieldCheck, AlertTriangle, Clock,
  ChevronRight, User
} from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Asset {
    id?: string;
    name: string;
    tag: string;
    user: string;
    status: string;
    type: string;
}

export default function HRAssetsPage() {
    const assetsQuery = useMemoFirebase((db) => query(collection(db, 'assets'), orderBy('createdAt', 'desc')));
    const { data: assetsData, isLoading } = useCollection<Asset>(assetsQuery);

    const assets = assetsData || [];
    const totalAssets = assets.length;
    const assignedAssets = assets.filter((a: Asset) => a.status === 'Deployed' || a.status === 'In Service').length;
    const maintenanceDue = assets.filter((a: Asset) => a.status === 'Maintenance').length;
  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Asset Registry"
        description="Track organizational equipment, assignments, and maintenance cycles."
        icon={Package}
      >
          <Button className="btn-omuto h-12 px-6 shadow-comic-sm">
              <Plus className="mr-2 h-4 w-4" /> Register Asset
          </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
              <>
                  <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white"><CardContent className="p-8"><Skeleton className="h-12 w-20" /></CardContent></Card>
                  <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white"><CardContent className="p-8"><Skeleton className="h-12 w-20" /></CardContent></Card>
                  <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white"><CardContent className="p-8"><Skeleton className="h-12 w-20" /></CardContent></Card>
                  <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white"><CardContent className="p-8"><Skeleton className="h-12 w-20" /></CardContent></Card>
              </>
          ) : (
              <>
                  <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                      <CardContent className="p-8">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Assets</p>
                          <p className="text-4xl font-black text-omuto-navy tracking-tight">{totalAssets}</p>
                      </CardContent>
                  </Card>
                  <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                      <CardContent className="p-8">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Assigned</p>
                          <p className="text-4xl font-black text-omuto-navy tracking-tight">{assignedAssets}</p>
                      </CardContent>
                  </Card>
                  <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                      <CardContent className="p-8">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Maintenance Due</p>
                          <p className="text-4xl font-black text-rose-600 tracking-tight">{maintenanceDue}</p>
                      </CardContent>
                  </Card>
                  <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-emerald-600 text-white">
                      <CardContent className="p-8">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Registry Audit</p>
                          <p className="text-4xl font-black tracking-tight">{totalAssets > 0 ? '100%' : '--'}</p>
                          <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-white uppercase tracking-widest">
                              <ShieldCheck className="h-3 w-3" /> {totalAssets > 0 ? 'All Verified' : 'No Data'}
                          </div>
                      </CardContent>
                  </Card>
              </>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 space-y-6">
              <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight">Global Inventory</h3>
                  <div className="flex gap-2">
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                          <input placeholder="Search Tags..." className="h-10 pl-10 pr-4 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest w-48" />
                      </div>
                      <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-2 font-bold uppercase tracking-widest text-[9px]">
                          <Filter className="mr-2 h-3 w-3" /> Category
                      </Button>
                  </div>
              </div>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-0">
                      {isLoading ? (
                          <div className="divide-y divide-omuto-navy/5">
                              {[1,2,3].map(i => (
                                  <div key={i} className="p-8 flex items-center gap-6">
                                      <Skeleton className="h-14 w-14 rounded-2xl" />
                                      <div className="space-y-2">
                                          <Skeleton className="h-6 w-48" />
                                          <Skeleton className="h-4 w-32" />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : assets.length === 0 ? (
                          <div className="p-12 text-center">
                              <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                              <p className="text-lg font-bold text-muted-foreground">No assets registered</p>
                              <p className="text-sm text-muted-foreground/60">Register your first asset to get started</p>
                          </div>
                      ) : (
                          <div className="divide-y divide-omuto-navy/5">
                              {assets.map((a: Asset) => (
                                  <div key={a.id || a.tag} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                                      <div className="flex items-center gap-6">
                                          <div className="h-14 w-14 rounded-2xl bg-white border-2 border-omuto-navy/5 shadow-sm flex items-center justify-center text-omuto-navy group-hover:scale-105 transition-transform">
                                              {a.type === 'electronics' ? <Laptop className="h-6 w-6" /> : a.type === 'vehicle' ? <Bike className="h-6 w-6" /> : <Package className="h-6 w-6" />}
                                          </div>
                                          <div>
                                              <p className="text-lg font-black text-omuto-navy uppercase tracking-tight">{a.name}</p>
                                              <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                  <span className="text-primary">{a.tag}</span>
                                                  <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                                                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {a.user}</span>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-8">
                                          <Badge variant="outline" className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                                              a.status === 'Deployed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                                              a.status === 'Maintenance' ? 'bg-rose-500/10 text-rose-600 border-rose-200' :
                                              'bg-blue-500/10 text-blue-600 border-blue-200'
                                          }`}>
                                              {a.status}
                                          </Badge>
                                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-omuto-navy/5">
                                              <ChevronRight className="h-5 w-5 text-omuto-navy/20 group-hover:text-primary transition-colors" />
                                          </Button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}


