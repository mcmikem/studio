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
  Clock, TrendingUp, Sparkles, UserCheck, ChevronRight
} from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function HRHiringPage() {
  const candidatesQuery = useMemoFirebase((db) =>
    query(collection(db, 'hiring-candidates'), orderBy('createdAt', 'desc'))
  );
  const { data: candidates, isLoading } = useCollection<any>(candidatesQuery);

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Recruitment Terminal"
        description="Manage the talent pipeline, from screening to onboarding."
        icon={UserPlus}
      >
          <Button className="btn-omuto shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Create Vacancy
          </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border shadow-sm bg-card">
              <CardContent className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Open Positions</p>
                  <p className="text-2xl font-bold text-omuto-navy tracking-tight">{isLoading ? '—' : (candidates?.length ?? 0)}</p>
                  <div className="flex items-center gap-1 mt-4 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                      <TrendingUp className="h-3 w-3" /> Active Pipeline
                  </div>
              </CardContent>
          </Card>
          <Card className="border shadow-sm bg-card">
              <CardContent className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Candidates</p>
                  <p className="text-2xl font-bold text-omuto-navy tracking-tight">{isLoading ? '—' : (candidates?.length ?? 0)}</p>
                  <div className="flex items-center gap-1 mt-4 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                      Active pipeline
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-sm bg-card">
              <CardContent className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Time to Hire</p>
                  <p className="text-2xl font-bold text-omuto-navy tracking-tight">18d</p>
                  <div className="flex items-center gap-1 mt-4 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                      <TrendingUp className="h-3 w-3" /> -4d improved
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-md bg-primary text-white">
              <CardContent className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">Offer Acceptance</p>
                  <p className="text-2xl font-bold tracking-tight">88%</p>
                   <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-white uppercase tracking-wider">
                      <CheckCircle2 className="h-3 w-3" /> High Conversion
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-omuto-navy tracking-tight">Talent Pipeline</h3>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-9 font-bold text-[11px] uppercase tracking-wider border">
                          <Filter className="mr-2 h-3.5 w-3.5" /> Filter
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 font-bold text-[11px] uppercase tracking-wider border">
                          <Search className="mr-2 h-3.5 w-3.5" /> Search
                      </Button>
                  </div>
              </div>

              <Card className="border shadow-sm">
                  <CardContent className="p-0">
                      <div className="divide-y">
                          {isLoading && (
                            <div className="p-6 space-y-4">
                              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                            </div>
                          )}
                          {!isLoading && (!candidates || candidates.length === 0) && (
                            <div className="p-12 text-center text-muted-foreground">
                              <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                              <p className="font-bold text-sm">No candidates in the pipeline yet.</p>
                            </div>
                          )}
                          {candidates?.map((c: any) => (
                              <div key={c.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                                  <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-full bg-omuto-navy/5 flex items-center justify-center font-bold text-omuto-navy text-sm">
                                          {c.name?.[0] || '?'}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-omuto-navy">{c.name}</p>
                                          <p className="text-xs text-muted-foreground">Applying for {c.role}</p>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-6">
                                      <div className="text-right hidden sm:block">
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 mb-0.5">Source: {c.source}</p>
                                          <p className="text-[10px] text-muted-foreground/60">{c.date}</p>
                                      </div>
                                      <Badge variant="outline" className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                          c.status === 'Offered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                          c.status === 'Interviewing' ? 'bg-primary/5 text-primary border-primary/10' :
                                          'bg-muted/50 text-muted-foreground border-transparent'
                                      }`}>
                                          {c.status}
                                      </Badge>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-omuto-navy/5">
                                          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                      </Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
              <h3 className="text-lg font-bold text-omuto-navy tracking-tight">Active Vacancies</h3>
              <div className="space-y-4">
                  <Card className="border shadow-sm p-5 group hover:border-primary/50 transition-colors cursor-pointer bg-card">
                      <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-primary/5 rounded-lg text-primary"><Briefcase className="h-4 w-4" /></div>
                          <Badge className="bg-emerald-600 text-white rounded-full text-[9px] font-bold">Active</Badge>
                      </div>
                      <h4 className="font-bold text-omuto-navy tracking-tight mb-1 text-sm">Field Coordinator</h4>
                      <p className="text-xs text-muted-foreground">Wakiso Region • Full-time</p>
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <span className="text-[10px] font-medium text-muted-foreground/50">12 Candidates</span>
                          <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                      </div>
                  </Card>

                  <Card className="border shadow-sm p-5 group hover:border-primary/50 transition-colors cursor-pointer bg-card">
                      <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><GraduationCap className="h-4 w-4" /></div>
                          <Badge className="bg-emerald-600 text-white rounded-full text-[9px] font-bold">Active</Badge>
                      </div>
                      <h4 className="font-bold text-omuto-navy tracking-tight mb-1 text-sm">Software Intern</h4>
                      <p className="text-xs text-muted-foreground">Remote • 6 Months</p>
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <span className="text-[10px] font-medium text-muted-foreground/50">5 Candidates</span>
                          <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                      </div>
                  </Card>
              </div>

              <Card className="border shadow-sm bg-muted/20 p-6 border-dashed">
                  <div className="flex flex-col items-center text-center">
                      <div className="h-14 w-14 rounded-full bg-card border-2 border-muted flex items-center justify-center mb-4 text-muted-foreground/40">
                          <Sparkles className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-omuto-navy mb-1 text-[13px]">AI Talent Scout</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-6">Scan candidate pool for ideal matches based on role requirements.</p>
                      <Button className="w-full h-11 rounded-xl bg-omuto-navy text-white font-bold uppercase tracking-wider text-[10px] hover:bg-primary transition-all">
                          Launch AI Scout
                      </Button>
                  </div>
              </Card>
          </div>
      </div>
    </div>
  );
}


