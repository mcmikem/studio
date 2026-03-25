'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  ShieldAlert, Search, Filter, 
  MessageSquare, Plus, ArrowRight,
  AlertCircle, CheckCircle2, Clock,
  ChevronRight, User, ShieldCheck,
  Scale, HelpingHand
} from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

const grievances = [
    { id: 'GV-001', subject: 'Inconsistent Field Allowance', user: 'Robert Kato', status: 'In Review', priority: 'High', date: 'Yesterday' },
    { id: 'GV-002', subject: 'Equipment Malfunction (Yamaha AG100)', user: 'Sarah Nakato', status: 'Resolved', priority: 'Medium', date: '3 days ago' },
    { id: 'GV-003', subject: 'Workspace Lighting Issue', user: 'Alice Nambogo', status: 'Open', priority: 'Low', date: '5 days ago' },
];

export default function HRGrievancesPage() {
  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Grievance Terminal"
        description="A secure and professional channel for resolving team concerns and institutional events."
        icon={ShieldAlert}
      >
          <div className="flex gap-3">
               <Button variant="outline" className="h-12 rounded-xl px-6 font-bold border-2">
                  <Scale className="mr-2 h-4 w-4" /> Mediation Log
              </Button>
              <Button className="btn-omuto h-12 px-6 shadow-comic-sm">
                  <HelpingHand className="mr-2 h-4 w-4" /> Support Case
              </Button>
          </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Open Cases</p>
                  <p className="text-4xl font-black text-rose-600 tracking-tight">2</p>
              </CardContent>
          </Card>
          <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">In Resolution</p>
                  <p className="text-4xl font-black text-amber-600 tracking-tight">1</p>
              </CardContent>
          </Card>
           <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Resolved YTD</p>
                  <p className="text-4xl font-black text-emerald-600 tracking-tight">24</p>
              </CardContent>
          </Card>
           <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-omuto-navy text-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Response Time</p>
                  <p className="text-4xl font-black tracking-tight">1.2d</p>
                   <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                      <ShieldCheck className="h-3 w-3" /> Within SLA
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 space-y-6">
              <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight">Active Resolution Queue</h3>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-2 font-bold uppercase tracking-widest text-[9px]">
                          <Filter className="mr-2 h-3 w-3" /> Priority
                      </Button>
                  </div>
              </div>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-0">
                      <div className="divide-y divide-omuto-navy/5">
                          {grievances.map((g, i) => (
                              <div key={i} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                                  <div className="flex items-center gap-6">
                                      <div className={`h-14 w-14 rounded-2xl bg-white border-2 flex items-center justify-center group-hover:scale-105 transition-transform ${
                                          g.priority === 'High' ? 'border-rose-100 text-rose-600' : 'border-omuto-navy/5 text-omuto-navy'
                                      }`}>
                                          <MessageSquare className="h-6 w-6" />
                                      </div>
                                      <div>
                                          <p className="text-lg font-black text-omuto-navy uppercase tracking-tight">{g.subject}</p>
                                          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                              <span className="text-primary">{g.id}</span>
                                              <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                                              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {g.user}</span>
                                              <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                                              <span>{g.date}</span>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-8">
                                      <Badge variant="outline" className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                                          g.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                                          g.status === 'In Review' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                          'bg-rose-500/10 text-rose-600 border-rose-200'
                                      }`}>
                                          {g.status}
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


