'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, where } from 'firebase/firestore';
import { use } from 'react';
import Link from 'next/link';
import {
  Building2, MapPin, Users, Star, Calendar, ClipboardCheck,
  GraduationCap, Heart, Flower2, Droplets, ArrowLeft,
  Eye, AlertCircle, FileText, StarHalf, CheckCircle2,
  Sparkles, TreePine, Navigation, Plus, ClipboardList
} from 'lucide-react';
import type { SchoolXperience, SchoolVisitXperience, SchoolScorecard, SchoolLeader } from '@/lib/types';
import { format } from 'date-fns';
import { InteractiveMap } from '@/components/school-xperience/interactive-map';

const PROGRAMME_ICONS: Record<string, React.ElementType> = {
  SLF: GraduationCap,
  RED: Heart,
  GreenSchools: Flower2,
  PureWater: Droplets,
};

const TIER_COLORS: Record<string, string> = {
  Partner: 'bg-blue-100 text-blue-700 border-blue-200',
  Active: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Advanced: 'bg-orange-100 text-orange-700 border-orange-200',
  Flagship: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  Registered: 'bg-gray-100 text-gray-700 border-gray-200',
  Launched: 'bg-blue-100 text-blue-700 border-blue-200',
  Active: 'bg-green-100 text-green-700 border-green-200',
  Completed: 'bg-purple-100 text-purple-700 border-purple-200',
  Inactive: 'bg-red-100 text-red-700 border-red-200',
};

const RATING_COLORS: Record<string, string> = {
  Red: 'bg-red-100 text-red-700 border-red-200',
  Amber: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Green: 'bg-green-100 text-green-700 border-green-200',
};

export default function SchoolProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firestore = useFirestore();

  const schoolDoc = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'sx-schools', id);
  }, [firestore, id]);

  const { data: school, isLoading: schoolLoading } = useDoc<SchoolXperience>(schoolDoc);

  const visitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sx-visits'),
      where('schoolId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const scorecardsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sx-scorecards'),
      where('schoolId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const leadersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sx-leaders'),
      where('schoolId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const { data: visits, isLoading: visitsLoading } = useCollection<SchoolVisitXperience>(visitsQuery);
  const { data: scorecards, isLoading: scorecardsLoading } = useCollection<SchoolScorecard>(scorecardsQuery);
  const { data: leaders, isLoading: leadersLoading } = useCollection<SchoolLeader>(leadersQuery);

  if (schoolLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">School Not Found</h2>
        <p className="text-muted-foreground mt-2">This school may have been removed or the link is invalid.</p>
        <Button asChild className="mt-6 btn-omuto rounded-xl">
          <Link href="/school-xperience"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
        </Button>
      </div>
    );
  }

  const flaggedVisits = visits?.filter((v) => v.flagForStory) || [];
  const recentVisits = visits?.slice(0, 5) || [];

  return (
    <div className="pb-20 space-y-10 animate-in fade-in duration-700">
      {/* Immersive Premium Header */}
      <div className="relative group overflow-hidden rounded-[3rem] border-4 border-omuto-navy/5 shadow-2xl bg-white/40 backdrop-blur-3xl min-h-[280px] sm:min-h-[320px] flex items-center p-6 sm:p-8 md:p-16">
        {/* Abstract Background Accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-1000" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-1000" />
        
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] border-2 shadow-sm ${STATUS_COLORS[school.status || 'Active']}`}>
                {school.status || 'Active'}
              </Badge>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-omuto-navy/5 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-omuto-navy/40">Mission Live</span>
              </div>
            </div>
            
            <div className="space-y-2">
                <h1 className="text-5xl md:text-7xl font-black text-omuto-navy tracking-tighter uppercase leading-[0.9]">
                    {school.schoolName}
                </h1>
                <div className="flex items-center gap-2 text-omuto-navy/40 font-bold uppercase tracking-widest text-xs ml-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{school.subCounty}, {school.district}</span>
                    <span className="mx-2 opacity-30">•</span>
                    <GraduationCap className="h-4 w-4 text-emerald-500" />
                    <span>{school.tier} Partner</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
                 <div className="flex items-center gap-4 bg-white/60 p-4 rounded-3xl border-2 border-white shadow-xl shadow-omuto-navy/5 transition-transform hover:scale-105">
                    <div className="h-12 w-12 rounded-2xl bg-omuto-navy/5 flex items-center justify-center text-omuto-navy">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-omuto-navy/30">Students</p>
                        <p className="text-xl font-black text-omuto-navy">{school.enrollmentSize?.toLocaleString() || '—'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/60 p-4 rounded-3xl border-2 border-white shadow-xl shadow-omuto-navy/5 transition-transform hover:scale-105">
                    <div className="h-12 w-12 rounded-2xl bg-omuto-navy/5 flex items-center justify-center text-omuto-navy">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-omuto-navy/30">Patron</p>
                        <p className="text-sm font-black text-omuto-navy truncate max-w-[120px]">{school.patronTeacher || 'Not Set'}</p>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0 bg-white/50 backdrop-blur-xl p-3 rounded-[2rem] border-2 border-white shadow-xl shadow-omuto-navy/5">
            <Button variant="outline" asChild className="h-12 px-6 rounded-2xl text-xs font-black uppercase tracking-widest border-2 hover:bg-primary/5 hover:border-primary transition-all group">
              <Link href={`/school-xperience/log-visit?schoolId=${id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                <ClipboardCheck className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                Log Visit
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-12 px-6 rounded-2xl text-xs font-black uppercase tracking-widest border-2 hover:bg-omuto-navy/5 hover:border-omuto-navy transition-all group">
              <Link href={`/school-xperience/submit-scorecard?schoolId=${id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                <StarHalf className="mr-2 h-4 w-4 text-amber-500 group-hover:rotate-12 transition-transform" />
                Submit Scorecard
              </Link>
            </Button>
            <Button asChild className="btn-omuto h-12 px-8 rounded-2xl text-xs font-black uppercase tracking-widest shadow-comic-sm">
              <Link href={`/school-xperience/${id}/edit`}>
                <Building2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {flaggedVisits.length > 0 && (
        <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <Card className="relative border-4 border-primary/30 bg-card/80 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <CardContent className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Star className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                        <div>
                            <p className="font-heading text-xl font-black text-omuto-navy uppercase tracking-tight">Mission Priority: Story Candidate</p>
                            <p className="text-xs font-bold text-omuto-navy/50">
                                {flaggedVisits.length} field record{flaggedVisits.length > 1 ? 's' : ''} flagged for the media team: {flaggedVisits.map((v) => v.date).join(', ')}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-14 rounded-2xl bg-white/50 backdrop-blur-md p-1.5 border-2 border-white shadow-xl">
          <TabsTrigger value="overview" className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-omuto-navy data-[state=active]:text-white transition-all px-6">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Mission Control
          </TabsTrigger>
          <TabsTrigger value="visits" className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-omuto-navy data-[state=active]:text-white transition-all px-6">
            <ClipboardCheck className="mr-2 h-3.5 w-3.5" />
            Mission Logs ({visits?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="scorecards" className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-omuto-navy data-[state=active]:text-white transition-all px-6">
            <Star className="mr-2 h-3.5 w-3.5" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="leaders" className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-omuto-navy data-[state=active]:text-white transition-all px-6">
            <Users className="mr-2 h-3.5 w-3.5" />
            Leadership
          </TabsTrigger>
          <TabsTrigger value="info" className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-omuto-navy data-[state=active]:text-white transition-all px-6">
             <FileText className="mr-2 h-3.5 w-3.5" />
             Intel
          </TabsTrigger>
          <TabsTrigger value="map" className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-omuto-navy data-[state=active]:text-white transition-all px-6 ml-auto">
            <MapPin className="mr-2 h-3.5 w-3.5" />
            Impact Intel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Performance Pulse */}
                <Card className="md:col-span-2 border-4 border-omuto-navy/5 shadow-2xl rounded-[2.5rem] bg-card/80 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Star className="h-32 w-32 rotate-12" />
                    </div>
                    <CardContent className="p-10 space-y-8 h-full flex flex-col justify-between">
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Performance Pulse</p>
                            </div>
                            <h3 className="font-heading text-4xl font-black text-omuto-navy uppercase tracking-tighter">Operational Heartbeat</h3>
                        </div>
                        
                        <div className="flex items-end gap-1">
                            {scorecards?.slice(0, 10).reverse().map((sc, i) => {
                                const val = (sc.attendanceScore + sc.activitiesCompleted + sc.studentEngagement + sc.teacherSupport) / 4;
                                return (
                                    <div 
                                        key={i} 
                                        className={`flex-1 rounded-full transition-all duration-1000 ${val >= 4 ? 'bg-emerald-500' : val >= 2.5 ? 'bg-amber-500' : 'bg-primary'}`}
                                        style={{ height: `${val * 20}%`, minHeight: '8px' }}
                                    />
                                );
                            })}
                            {(scorecards || []).length === 0 && (
                                <div className="w-full h-2 rounded-full bg-muted/30" />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-omuto-navy/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Compliance</p>
                                <p className="text-3xl font-black text-omuto-navy">94%</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Last Rated</p>
                                <p className="text-3xl font-black text-omuto-navy">
                                    {scorecards?.[0]?.month || 'None'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Impact Summary */}
                <div className="grid md:grid-cols-1 gap-6 md:col-span-2">
                    <div className="grid grid-cols-2 gap-6">
                        <Card className="border-4 border-omuto-navy/5 shadow-2xl rounded-[2.5rem] bg-card/80 p-8 flex flex-col justify-between hover:border-primary/20 transition-colors group">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit group-hover:scale-110 transition-transform">
                                <Heart className="h-6 w-6" />
                            </div>
                            <div className="mt-4">
                                <p className="text-4xl font-black text-omuto-navy">124</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">RED Girls Reached</p>
                            </div>
                        </Card>
                         <Card className="border-4 border-omuto-navy/5 shadow-2xl rounded-[2.5rem] bg-card/80 p-8 flex flex-col justify-between hover:border-emerald-500/20 transition-colors group">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 w-fit group-hover:scale-110 transition-transform">
                                <TreePine className="h-6 w-6" />
                            </div>
                            <div className="mt-4">
                                <p className="text-4xl font-black text-omuto-navy">45</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Trees Planted</p>
                            </div>
                        </Card>
                    </div>
                    <Card className="border-4 border-omuto-navy/5 shadow-2xl rounded-[2.5rem] bg-omuto-navy text-white p-8 flex items-center justify-between group overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Navigation className="h-24 w-24 text-white" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Next Scheduled Visit</p>
                            <h4 className="text-2xl font-black uppercase font-heading tracking-tight leading-none italic">Wednesday, 25 March</h4>
                            <p className="text-xs font-bold text-white/60 mt-2">Routine Support • Field Officer: Nalule</p>
                        </div>
                        <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md relative z-10 border border-white/20">
                            <ArrowLeft className="h-6 w-6 rotate-180" />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Program Wall */}
            <div className="flex flex-wrap gap-4">
                {(['SLF', 'RED', 'GreenSchools', 'PureWater'] as const).map(prog => {
                    const Icon = PROGRAMME_ICONS[prog] || Star;
                    const isActive = school?.activeProgrammes?.includes(prog as any);
                    return (
                        <div 
                            key={prog} 
                            className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] border-4 transition-all ${
                                isActive 
                                ? 'bg-white border-omuto-navy/10 shadow-xl' 
                                : 'bg-transparent border-dashed border-omuto-navy/10 opacity-30 grayscale'
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                            <span className="text-xs font-black uppercase tracking-widest text-omuto-navy">{prog}</span>
                            {isActive && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                    );
                })}
            </div>
        </TabsContent>

        <TabsContent value="visits" className="space-y-6">
          <Card className="border-4 border-omuto-navy/5 shadow-2xl rounded-[2.5rem] bg-card/80 overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-omuto-navy/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Mission Archives</p>
                  <CardTitle className="text-3xl font-black text-omuto-navy uppercase tracking-tighter">Field Activity Log</CardTitle>
                </div>
                <Button asChild className="btn-omuto h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-comic-sm">
                  <Link href={`/school-xperience/log-visit?schoolId=${id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Entry
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {visitsLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
              ) : !visits || visits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No visits logged yet</p>
                  <p className="text-sm">Log the first monitoring visit for this school.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.map((visit) => (
                    <div key={visit.id} className="border-lg rounded-2xl p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-bold text-sm">{visit.date}</span>
                            <span className="text-xs text-muted-foreground">by {visit.visitor}</span>
                            {visit.flagForStory && (
                              <Badge variant="outline" className="text-xs font-bold gap-1 text-primary border-primary/30">
                                <Star className="h-3 w-3" />
                                Story Candidate
                              </Badge>
                            )}
                          </div>
                          {visit.programmesCovered && visit.programmesCovered.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {visit.programmesCovered.map((p) => {
                                const Icon = PROGRAMME_ICONS[p] || Star;
                                return (
                                  <Badge key={p} variant="outline" className="text-xs font-bold gap-1">
                                    <Icon className="h-3 w-3" />
                                    {p}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">{visit.objectivesMet}</p>
                          {visit.followUpActions && (
                            <div className="mt-2 flex items-start gap-1.5">
                              <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs font-semibold text-amber-600">Follow-up: {visit.followUpActions}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Photo gallery for this visit */}
                      {visit.photos && visit.photos.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {visit.photos.slice(0, 4).map((photo, idx) => (
                              <div
                                key={idx}
                                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-muted cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={photo}
                                  alt={`Visit photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 3 && visit.photos && visit.photos.length > 4 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">+{visit.photos.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scorecards" className="space-y-6">
          <Card className="border-4 border-omuto-navy/5 shadow-2xl rounded-[2.5rem] bg-card/80 overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-omuto-navy/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Performance Metrics</p>
                  <CardTitle className="text-3xl font-black text-omuto-navy uppercase tracking-tighter">Termly Scorecards</CardTitle>
                </div>
                <Button asChild className="btn-omuto h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-comic-sm">
                  <Link href={`/school-xperience/submit-scorecard?schoolId=${id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                    <StarHalf className="mr-2 h-4 w-4" />
                    New Scorecard
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {scorecardsLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
              ) : !scorecards || scorecards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <StarHalf className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No scorecards submitted yet</p>
                  <p className="text-sm">Submit the first scorecard for this school.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scorecards.map((sc) => {
                    const overall = [sc.attendanceScore, sc.activitiesCompleted, sc.studentEngagement, sc.teacherSupport]
                      .reduce((a, b) => a + b, 0) / 4;
                    const rating = overall >= 4 ? 'Green' : overall >= 2.5 ? 'Amber' : 'Red';
                    return (
                      <div key={sc.id} className="border-lg rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold">{sc.month} {sc.academicYear}</p>
                            <p className="text-xs text-muted-foreground">{sc.term}</p>
                          </div>
                          <Badge className={`text-xs font-bold border ${RATING_COLORS[rating]}`}>
                            {rating}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: 'Attendance', value: sc.attendanceScore },
                            { label: 'Activities', value: sc.activitiesCompleted },
                            { label: 'Engagement', value: sc.studentEngagement },
                            { label: 'Teacher Support', value: sc.teacherSupport },
                          ].map((item) => (
                            <div key={item.label} className="text-center">
                              <div className="flex justify-center gap-0.5 mb-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <div
                                    key={n}
                                    className={`h-2 w-3 rounded-sm ${n <= item.value ? 'bg-primary' : 'bg-muted'}`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs font-bold text-muted-foreground">{item.label}</p>
                            </div>
                          ))}
                        </div>
                        {sc.notes && <p className="text-xs text-muted-foreground mt-3 italic">{sc.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaders" className="space-y-6">
          <Card className="border-4 border-omuto-navy/5 shadow-2xl rounded-[2.5rem] bg-card/80 overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-omuto-navy/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Student Governance</p>
                  <CardTitle className="text-3xl font-black text-omuto-navy uppercase tracking-tighter">Commissioned Leaders</CardTitle>
                </div>
                <Button asChild className="btn-omuto h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-comic-sm">
                  <Link href={`/school-xperience/add-leader?schoolId=${id}&schoolName=${encodeURIComponent(school.schoolName || '')}`}>
                    <Users className="mr-2 h-4 w-4" />
                    Add Leader
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {leadersLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              ) : !leaders || leaders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No leaders registered yet</p>
                  <p className="text-sm">Add student leaders when they are commissioned.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {leaders.map((leader) => (
                    <div key={leader.id} className="border-lg rounded-2xl p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{leader.name}</p>
                        <p className="text-xs text-muted-foreground">{leader.role}</p>
                        {leader.year && <p className="text-xs text-muted-foreground">Year: {leader.year}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <Card className="border-4 border-omuto-navy/5 shadow-2xl rounded-[2.5rem] bg-card/80 overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-omuto-navy/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Institutional Profile</p>
                  <CardTitle className="text-3xl font-black text-omuto-navy uppercase tracking-tighter">Detailed Intel</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InfoRow label="School Name" value={school.schoolName} />
                <InfoRow label="Status" value={school.status} />
                <InfoRow label="Location" value={school.location} />
                <InfoRow label="Sub-County" value={school.subCounty} />
                <InfoRow label="District" value={school.district} />
                <InfoRow label="Patron Teacher" value={school.patronTeacher} />
                <InfoRow label="Patron Phone" value={school.patronPhone} />
                <InfoRow label="Patron Email" value={school.patronEmail} />
                <InfoRow label="Head Teacher" value={school.headTeacher} />
                <InfoRow label="Enrollment" value={school.enrollmentSize ? String(school.enrollmentSize) : undefined} />
                <InfoRow label="Tier" value={school.tier} />
                <InfoRow label="Academic Year" value={school.academicYear} />
              </div>
              {school.notes && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{school.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card className="border-4 border-omuto-navy/5 shadow-2xl rounded-[2.5rem] bg-card/80 overflow-hidden">
             <CardHeader className="p-8 pb-4 border-b border-omuto-navy/5">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Geospatial Context</p>
                    <CardTitle className="text-3xl font-black text-omuto-navy uppercase tracking-tighter">Impact Coordinates</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
              {(school as any).coordinates ? (
                <div className="h-[300px] sm:h-[400px] md:h-[500px] w-full relative">
                  <InteractiveMap
                    locations={[{
                      id: school.id || '',
                      name: school.schoolName || 'Unknown',
                      type: 'school',
                      coordinates: (school as any).coordinates,
                      subcounty: school.subCounty,
                      district: school.district,
                      programme: school.activeProgrammes?.[0],
                    }]}
                    center={{ 
                      lat: (school as any).coordinates?.lat || 0.233, 
                      lng: (school as any).coordinates?.lng || 32.333 
                    }}
                    zoom={15}
                    className="h-full"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-muted-foreground bg-muted/10">
                  <MapPin className="h-16 w-16 mb-6 opacity-30 text-omuto-navy" />
                  <p className="font-heading text-2xl font-black text-omuto-navy uppercase tracking-tighter">No GPS coordinates recorded</p>
                  <p className="text-sm font-bold text-omuto-navy/40 mt-2">Update this school profile to add location data.</p>
                  <Button asChild variant="outline" className="mt-8 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest px-8">
                    <Link href={`/school-xperience/${id}/edit`}>Add Coordinates</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-bold text-sm mt-0.5">{value}</p>
    </div>
  );
}
