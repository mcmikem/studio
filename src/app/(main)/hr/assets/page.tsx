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

const assets = [
    { name: 'MacBook Air M2', tag: 'OM-AST-001', user: 'Mark Mutumba', status: 'Deployed', type: 'electronics' },
    { name: 'Yamaha AG100', tag: 'OM-AST-042', user: 'Sarah Namulondo', status: 'In Service', type: 'vehicle' },
    { name: 'Dell Monitor 27"', tag: 'OM-AST-089', user: 'James Kasozi', status: 'Deployed', type: 'electronics' },
    { name: 'Solar Purifier Kit', tag: 'OM-AST-112', user: 'Field Team A', status: 'Maintenance', type: 'equipment' },
];

export default function HRAssetsPage() {
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
          <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Assets</p>
                  <p className="text-4xl font-black text-omuto-navy tracking-tight">142</p>
              </CardContent>
          </Card>
          <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Assigned</p>
                  <p className="text-4xl font-black text-omuto-navy tracking-tight">118</p>
              </CardContent>
          </Card>
           <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Maintenance Due</p>
                  <p className="text-4xl font-black text-rose-600 tracking-tight">5</p>
              </CardContent>
          </Card>
           <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-emerald-600 text-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Registry Audit</p>
                  <p className="text-4xl font-black tracking-tight">100%</p>
                   <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-white uppercase tracking-widest">
                      <ShieldCheck className="h-3 w-3" /> All Verified
                  </div>
              </CardContent>
          </Card>
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
                      <div className="divide-y divide-omuto-navy/5">
                          {assets.map((a, i) => (
                              <div key={i} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors group">
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
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m9 18 6-6-6-6"/>
        </svg>
    );
}
