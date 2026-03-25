'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  UserPlus, Search, Filter, 
  MoreHorizontal, Plus, ArrowRight,
  FileText, CheckCircle2, XCircle,
  Briefcase, GraduationCap, MapPin,
  Clock, TrendingUp, Sparkles, UserCheck
} from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

const candidates = [
    { name: 'Alice Nambogo', role: 'Field Coordinator', status: 'Interviewing', source: 'LinkedIn', date: '2 days ago' },
    { name: 'Robert Kato', role: 'Finance Assistant', status: 'Applied', source: 'Referral', date: '5 days ago' },
    { name: 'Sarah Nakato', role: 'Social Worker', status: 'Offered', source: 'Portal', date: '1 week ago' },
    { name: 'John Doe', role: 'Software Intern', status: 'Screening', source: 'Indeed', date: '3 days ago' },
];

export default function HRHiringPage() {
  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Recruitment Terminal"
        description="Manage the talent pipeline, from screening to onboarding."
        icon={UserPlus}
      >
          <Button className="btn-omuto h-12 px-6 shadow-comic-sm">
              <Plus className="mr-2 h-4 w-4" /> Create Vacancy
          </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Open Positions</p>
                  <p className="text-4xl font-black text-omuto-navy tracking-tight">4</p>
                  <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                      <TrendingUp className="h-3 w-3" /> 2 New this week
                  </div>
              </CardContent>
          </Card>
          <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Candidates</p>
                  <p className="text-4xl font-black text-omuto-navy tracking-tight">28</p>
                  <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                      Active pipeline
                  </div>
              </CardContent>
          </Card>
           <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Time to Hire</p>
                  <p className="text-4xl font-black text-omuto-navy tracking-tight">18d</p>
                  <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                      <TrendingUp className="h-3 w-3" /> -4d improved
                  </div>
              </CardContent>
          </Card>
           <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-primary text-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Offer Acceptance</p>
                  <p className="text-4xl font-black tracking-tight">88%</p>
                   <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-white uppercase tracking-widest">
                      <CheckCircle2 className="h-3 w-3" /> High Conversion
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight">Talent Pipeline</h3>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-2 font-bold uppercase tracking-widest text-[9px]">
                          <Filter className="mr-2 h-3 w-3" /> Filter
                      </Button>
                      <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-2 font-bold uppercase tracking-widest text-[9px]">
                          <Search className="mr-2 h-3 w-3" /> Search
                      </Button>
                  </div>
              </div>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-0">
                      <div className="divide-y divide-omuto-navy/5">
                          {candidates.map((c, i) => (
                              <div key={i} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                                  <div className="flex items-center gap-4">
                                      <div className="h-12 w-12 rounded-2xl bg-omuto-navy/5 flex items-center justify-center font-black text-omuto-navy text-sm border-2 border-white shadow-sm">
                                          {c.name[0]}
                                      </div>
                                      <div>
                                          <p className="text-base font-black text-omuto-navy uppercase tracking-tight">{c.name}</p>
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Applying for {c.role}</p>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-8">
                                      <div className="text-right hidden sm:block">
                                          <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Source: {c.source}</p>
                                          <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">{c.date}</p>
                                      </div>
                                      <Badge variant="outline" className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                                          c.status === 'Offered' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                                          c.status === 'Interviewing' ? 'bg-primary/10 text-primary border-primary/20' :
                                          'bg-muted text-muted-foreground border-transparent'
                                      }`}>
                                          {c.status}
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

          <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight">Active Vacancies</h3>
              <div className="space-y-4">
                  <Card className="border-2 border-omuto-navy/10 rounded-[2rem] p-6 group hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary"><Briefcase className="h-5 w-5" /></div>
                          <Badge className="bg-emerald-600 text-white rounded-full text-[8px] font-black tracking-widest">Active</Badge>
                      </div>
                      <h4 className="font-black text-omuto-navy uppercase tracking-tight mb-1">Field Coordinator</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Wakiso Region • Full-time</p>
                      <div className="mt-4 pt-4 border-t border-omuto-navy/5 flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase text-muted-foreground/40">12 Candidates</span>
                          <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                  </Card>

                  <Card className="border-2 border-omuto-navy/10 rounded-[2rem] p-6 group hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600"><GraduationCap className="h-5 w-5" /></div>
                          <Badge className="bg-emerald-600 text-white rounded-full text-[8px] font-black tracking-widest">Active</Badge>
                      </div>
                      <h4 className="font-black text-omuto-navy uppercase tracking-tight mb-1">Software Intern</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Remote • 6 Months</p>
                      <div className="mt-4 pt-4 border-t border-omuto-navy/5 flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase text-muted-foreground/40">5 Candidates</span>
                          <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                  </Card>
              </div>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-muted/30 p-8 border-dashed">
                  <div className="flex flex-col items-center text-center">
                      <div className="h-16 w-16 rounded-full bg-white border-4 border-muted flex items-center justify-center mb-4 text-muted-foreground/40">
                          <Sparkles className="h-8 w-8" />
                      </div>
                      <p className="text-xs font-black text-omuto-navy uppercase tracking-tight mb-1">AI Talent Scout</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed mb-6">Let Omuto AI scan the latest candidate pool for ideal matches based on role requirements.</p>
                      <Button className="w-full h-12 rounded-xl bg-omuto-navy text-white font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all">
                          Launch AI Scout
                      </Button>
                  </div>
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
