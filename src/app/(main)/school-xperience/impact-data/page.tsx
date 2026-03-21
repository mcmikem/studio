'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter as CardFooterPrimitive } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import Link from 'next/link';
import {
  Users, Droplets, TreePine, MapPin, Calendar,
  Heart, CheckCircle2, AlertCircle, Map as MapIcon,
  Plus, Eye, Filter, GraduationCap, Building2,
  Sparkles, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { InteractiveMap, type MapLocation } from '@/components/school-xperience/interactive-map';
import { GPSLocationPicker } from '@/components/ui/gps-location-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const trainingSchema = z.object({
  schoolId: z.string().min(1, 'School is required'),
  schoolName: z.string().min(1, 'School name is required'),
  date: z.string().min(1, 'Date is required'),
  trainerName: z.string().min(2, 'Trainer name is required'),
  programme: z.enum(['SLF', 'RED', 'GreenSchools', 'PureWater']),
  trainingType: z.string().min(2, 'Training type is required'),
  participantsMale: z.coerce.number().min(0).default(0),
  participantsFemale: z.coerce.number().min(0).default(0),
  topicsCovered: z.string().min(10, 'Topics covered is required'),
  outcomes: z.string().optional(),
});

type TrainingData = z.infer<typeof trainingSchema>;

export default function ImpactDataPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [showTrainingForm, setShowTrainingForm] = useState(false);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore]);

  const { data: schools } = useCollection<any>(schoolsQuery);

  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-beneficiaries'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const waterSourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-water-sources'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const treesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-trees'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const trainingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-trainings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: beneficiaries, isLoading: benLoading } = useCollection<any>(beneficiariesQuery);
  const { data: waterSources, isLoading: waterLoading } = useCollection<any>(waterSourcesQuery);
  const { data: trees, isLoading: treeLoading } = useCollection<any>(treesQuery);
  const { data: trainings, isLoading: trainLoading } = useCollection<any>(trainingsQuery);

  const filteredBeneficiaries = selectedSchoolId
    ? (beneficiaries || []).filter(b => b.schoolId === selectedSchoolId)
    : (beneficiaries || []);

  const filteredWaterSources = selectedSchoolId
    ? (waterSources || []).filter(w => w.schoolId === selectedSchoolId)
    : (waterSources || []);

  const filteredTrees = selectedSchoolId
    ? (trees || []).filter(t => t.schoolId === selectedSchoolId)
    : (trees || []);

  const filteredTrainings = selectedSchoolId
    ? (trainings || []).filter(t => t.schoolId === selectedSchoolId)
    : (trainings || []);

  const mapLocations: MapLocation[] = [
    ...(beneficiaries || []).filter(b => b.coordinates).map(b => ({
      id: b.id,
      name: `${b.beneficiaryType} - ${b.programme}`,
      type: 'beneficiary' as const,
      coordinates: b.coordinates,
      subcounty: (schools?.find(s => s.id === b.schoolId) as any)?.subCounty,
      district: (schools?.find(s => s.id === b.schoolId) as any)?.district,
      programme: b.programme,
    })),
    ...(waterSources || []).filter(w => w.coordinates).map(w => ({
      id: w.id,
      name: `${w.sourceType} - ${w.status}`,
      type: 'water' as const,
      coordinates: w.coordinates,
      subcounty: (schools?.find(s => s.id === w.schoolId) as any)?.subCounty,
      district: (schools?.find(s => s.id === w.schoolId) as any)?.district,
      programme: 'PureWater',
    })),
    ...(trees || []).filter(t => t.coordinates).map(t => ({
      id: t.id,
      name: `${t.quantity} ${t.treeType} trees`,
      type: 'tree' as const,
      coordinates: t.coordinates,
      subcounty: (schools?.find(s => s.id === t.schoolId) as any)?.subCounty,
      district: (schools?.find(s => s.id === t.schoolId) as any)?.district,
      programme: 'GreenSchools',
    })),
    ...(trainings || []).filter(t => t.coordinates).map(t => ({
      id: t.id,
      name: `${t.trainingType} - ${t.programme}`,
      type: 'training' as const,
      coordinates: t.coordinates,
      subcounty: (schools?.find(s => s.id === t.schoolId) as any)?.subCounty,
      district: (schools?.find(s => s.id === t.schoolId) as any)?.district,
      programme: t.programme,
    })),
  ];

  const stats = {
    totalBeneficiaries: beneficiaries?.length || 0,
    totalWaterSources: waterSources?.length || 0,
    totalTrees: trees?.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0) || 0,
    totalTrainings: trainings?.length || 0,
    functionalWater: (waterSources || []).filter((w: any) => w.status === 'functional').length,
    nonFunctionalWater: (waterSources || []).filter((w: any) => w.status === 'non_functional').length,
    femaleBeneficiaries: (beneficiaries || []).filter((b: any) => b.gender === 'female').length,
    maleBeneficiaries: (beneficiaries || []).filter((b: any) => b.gender === 'male').length,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={MapIcon}
        title="Impact Data"
        description="View and manage beneficiaries, water sources, trees planted, and training sessions."
        breadcrumbs={[
          { name: 'Dashboard', href: '/' },
          { name: 'School Xperience', href: '/school-xperience' },
          { name: 'Impact Data', href: '/school-xperience/impact-data' },
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Beneficiaries" value={stats.totalBeneficiaries} sub={`${stats.femaleBeneficiaries}F, ${stats.maleBeneficiaries}M`} color="text-purple-600" bg="bg-purple-50" alertLevel={stats.totalBeneficiaries === 0 ? 'yellow' : 'green'} />
        <StatCard icon={Droplets} label="Water Sources" value={stats.totalWaterSources} sub={`${stats.functionalWater} functional`} color="text-cyan-600" bg="bg-cyan-50" alertLevel={stats.nonFunctionalWater > 0 ? 'yellow' : 'green'} />
        <StatCard icon={TreePine} label="Trees Planted" value={stats.totalTrees} sub="across all schools" color="text-green-600" bg="bg-green-50" alertLevel={stats.totalTrees === 0 ? 'yellow' : 'green'} />
        <StatCard icon={GraduationCap} label="Trainings" value={stats.totalTrainings} sub="sessions conducted" color="text-blue-600" bg="bg-blue-50" alertLevel={stats.totalTrainings === 0 ? 'yellow' : 'green'} />
      </div>

      <Tabs defaultValue="beneficiaries" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <Sparkles className="h-4 w-4 text-omuto-red" />
            <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Data Hub</span>
          </div>
          <TabsList className="h-12 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="beneficiaries" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
              <Users className="mr-2 h-4 w-4" />
              Beneficiaries
            </TabsTrigger>
            <TabsTrigger value="water" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
              <Droplets className="mr-2 h-4 w-4" />
              Water
            </TabsTrigger>
            <TabsTrigger value="trees" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
              <TreePine className="mr-2 h-4 w-4" />
              Trees
            </TabsTrigger>
            <TabsTrigger value="trainings" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
              <GraduationCap className="mr-2 h-4 w-4" />
              Trainings
            </TabsTrigger>
            <TabsTrigger value="map" className="h-9 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background">
              <MapIcon className="mr-2 h-4 w-4" />
              Map
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="h-10 rounded-xl border-lg px-3 text-sm font-semibold bg-background"
            >
              <option value="">All Schools</option>
              {schools?.map(s => (
                <option key={s.id} value={s.id}>{s.schoolName}</option>
              ))}
            </select>
            <Button asChild className="btn-omuto h-10 rounded-xl text-xs font-black uppercase tracking-widest">
              <Link href="/school-xperience/log-impact">
                <Plus className="mr-1 h-4 w-4" />
                Log Impact
              </Link>
            </Button>
          </div>
        </div>

        <TabsContent value="beneficiaries">
          <BeneficiariesView data={filteredBeneficiaries} schools={schools || []} isLoading={benLoading} />
        </TabsContent>

        <TabsContent value="water">
          <WaterSourcesView data={filteredWaterSources} schools={schools || []} isLoading={waterLoading} />
        </TabsContent>

        <TabsContent value="trees">
          <TreesView data={filteredTrees} schools={schools || []} isLoading={treeLoading} />
        </TabsContent>

        <TabsContent value="trainings">
          <TrainingsView
            data={filteredTrainings}
            schools={schools || []}
            isLoading={trainLoading}
            firestore={firestore}
            toast={toast}
          />
        </TabsContent>

        <TabsContent value="map">
          <InteractiveMap
            locations={mapLocations}
            center={{ lat: 0.233, lng: 32.333 }}
            zoom={11}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, bg, alertLevel }: {
  icon: any; label: string; value: number; sub: string; color: string; bg: string; alertLevel?: 'green' | 'yellow' | 'red';
}) {
  const dotColor = alertLevel === 'red' ? 'bg-red-500' : alertLevel === 'yellow' ? 'bg-yellow-500' : 'bg-green-500';
  const borderColor = alertLevel === 'red' ? 'border-l-4 border-l-red-500' : alertLevel === 'yellow' ? 'border-l-4 border-l-yellow-500' : alertLevel === 'green' ? 'border-l-4 border-l-green-500' : '';

  return (
    <Card className={`border-lg shadow-comic-sm ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`inline-flex items-center justify-center p-2 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          {alertLevel && <span className={`w-2.5 h-2.5 rounded-full ${dotColor} ${alertLevel === 'green' ? 'animate-pulse' : ''}`} />}
        </div>
        <p className="text-2xl font-black">{value.toLocaleString()}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function BeneficiariesView({ data, schools, isLoading }: { data: any[]; schools: any[]; isLoading: boolean }) {
  return (
    <Card className="border-lg shadow-comic-sm">
      <CardHeader className="bg-muted/30 border-b-lg">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Beneficiary Records
        </CardTitle>
        <CardDescription>{data.length} beneficiaries recorded</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={Users} message="No beneficiaries logged yet" sub="Log beneficiaries from the Log Impact page." />
        ) : (
          <div className="space-y-3">
            {data.map(b => (
              <div key={b.id} className="border-lg rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{b.beneficiaryType} - {b.programme}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.gender} - {b.ageGroup} - {schools.find(s => s.id === b.schoolId)?.schoolName || 'Unknown school'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{b.date}</p>
                    {b.coordinates && <Badge variant="outline" className="text-xs mt-1"><MapPin className="h-3 w-3 mr-1" />GPS</Badge>}
                  </div>
                </div>
                {b.servicesProvided && Array.isArray(b.servicesProvided) && b.servicesProvided.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {b.servicesProvided.map((s: string) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WaterSourcesView({ data, schools, isLoading }: { data: any[]; schools: any[]; isLoading: boolean }) {
  return (
    <Card className="border-lg shadow-comic-sm">
      <CardHeader className="bg-muted/30 border-b-lg">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <Droplets className="h-5 w-5 text-cyan-600" />
          Water Sources
        </CardTitle>
        <CardDescription>{data.length} water sources recorded</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={Droplets} message="No water sources logged yet" sub="Log water sources from the Log Impact page." />
        ) : (
          <div className="space-y-3">
            {data.map(w => (
              <div key={w.id} className="border-lg rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      w.status === 'functional' ? 'bg-green-100' : w.status === 'needs_repair' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      <Droplets className={`h-5 w-5 ${
                        w.status === 'functional' ? 'text-green-600' : w.status === 'needs_repair' ? 'text-amber-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm capitalize">{String(w.sourceType || '').replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {schools.find(s => s.id === w.schoolId)?.schoolName || 'Unknown'} - Est. {w.estimatedBeneficiaries} beneficiaries
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-xs ${
                      w.status === 'functional' ? 'bg-green-100 text-green-700' :
                      w.status === 'needs_repair' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {w.status === 'functional' ? 'Functional' : w.status === 'needs_repair' ? 'Needs Repair' : 'Non-Functional'}
                    </Badge>
                    {w.coordinates && <Badge variant="outline" className="text-xs mt-1"><MapPin className="h-3 w-3 mr-1" />GPS</Badge>}
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Quality: <span className={`font-bold ${
                    w.waterQuality === 'safe' ? 'text-green-600' : w.waterQuality === 'needs_treatment' ? 'text-amber-600' : 'text-red-600'
                  }`}>{w.waterQuality}</span></span>
                  <span>Date: {w.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TreesView({ data, schools, isLoading }: { data: any[]; schools: any[]; isLoading: boolean }) {
  return (
    <Card className="border-lg shadow-comic-sm">
      <CardHeader className="bg-muted/30 border-b-lg">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <TreePine className="h-5 w-5 text-green-600" />
          Trees Planted
        </CardTitle>
        <CardDescription>{data.length} planting records</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={TreePine} message="No trees logged yet" sub="Log trees from the Log Impact page." />
        ) : (
          <div className="space-y-3">
            {data.map(t => (
              <div key={t.id} className="border-lg rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TreePine className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.quantity} {t.treeType} trees</p>
                      <p className="text-xs text-muted-foreground">
                        {schools.find(s => s.id === t.schoolId)?.schoolName || 'Unknown'}
                        {t.plantingArea && ` - ${t.plantingArea}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                    {t.survivalCount !== undefined && (
                      <Badge variant="outline" className="text-xs mt-1">{t.survivalCount} survived</Badge>
                    )}
                    {t.coordinates && <Badge variant="outline" className="text-xs mt-1"><MapPin className="h-3 w-3 mr-1" />GPS</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CardFooter = CardFooterPrimitive;

function TrainingsView({ data, schools, isLoading, firestore, toast }: { data: any[]; schools: any[]; isLoading: boolean; firestore: any; toast: any }) {
  const [showForm, setShowForm] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const form = useForm<TrainingData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      programme: 'SLF',
      participantsMale: 0,
      participantsFemale: 0,
    },
  });

  const onSubmit = (formData: TrainingData) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'sx-trainings'), {
      ...formData,
      coordinates: coordinates || undefined,
      createdAt: serverTimestamp(),
      createdBy: 'system',
    });
    toast({ title: 'Training Logged', description: `${formData.trainingType} recorded.` });
    setShowForm(false);
    window.location.reload();
  };

  if (showForm) {
    return (
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Log Training Session
          </CardTitle>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">School *</Label>
                <select
                  {...form.register('schoolId')}
                  onChange={(e) => {
                    const school = schools.find(s => s.id === e.target.value);
                    form.setValue('schoolId', e.target.value);
                    form.setValue('schoolName', school?.schoolName || '');
                  }}
                  className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
                >
                  <option value="">Select school...</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.schoolName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Date *</Label>
                <Input type="date" {...form.register('date')} className="border-lg rounded-xl h-12 font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Trainer Name *</Label>
                <Input {...form.register('trainerName')} placeholder="Trainer's name" className="border-lg rounded-xl h-12 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Programme *</Label>
                <select {...form.register('programme')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                  <option value="SLF">SLF</option>
                  <option value="RED">RED</option>
                  <option value="GreenSchools">GreenSchools</option>
                  <option value="PureWater">PureWater</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest">Training Type *</Label>
              <Input {...form.register('trainingType')} placeholder="e.g., Leadership Training" className="border-lg rounded-xl h-12 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Male Participants</Label>
                <Input type="number" {...form.register('participantsMale')} className="border-lg rounded-xl h-12 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Female Participants</Label>
                <Input type="number" {...form.register('participantsFemale')} className="border-lg rounded-xl h-12 font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest">Topics Covered *</Label>
              <Textarea {...form.register('topicsCovered')} placeholder="What was covered..." className="border-lg rounded-xl min-h-[80px] font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest">Outcomes</Label>
              <Textarea {...form.register('outcomes')} placeholder="Key outcomes..." className="border-lg rounded-xl min-h-[60px] font-bold" />
            </div>
            <GPSLocationPicker coordinates={coordinates} onCoordinatesChange={setCoordinates} label="Training Location" />
          </CardContent>
          <CardFooter className="enterprise-form-footer">
            <div className="flex gap-2 w-full">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-12 rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" className="btn-omuto flex-1 h-12 rounded-xl font-black uppercase tracking-widest">
                Log Training
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="border-lg shadow-comic-sm">
      <CardHeader className="bg-muted/30 border-b-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Training Sessions
            </CardTitle>
            <CardDescription>{data.length} sessions recorded</CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)} className="btn-omuto h-10 rounded-xl text-xs font-black uppercase tracking-widest">
            <Plus className="mr-1 h-4 w-4" />
            Log Training
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={GraduationCap} message="No training sessions logged yet" sub="Log training sessions from this page." />
        ) : (
          <div className="space-y-3">
            {data.map(t => (
              <div key={t.id} className="border-lg rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.trainingType}</p>
                      <p className="text-xs text-muted-foreground">
                        {schools.find(s => s.id === t.schoolId)?.schoolName || 'Unknown'} - {t.programme}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                    <p className="text-xs font-bold mt-1">
                      {Number(t.participantsMale || 0) + Number(t.participantsFemale || 0)} participants
                    </p>
                    {t.coordinates && <Badge variant="outline" className="text-xs mt-1"><MapPin className="h-3 w-3 mr-1" />GPS</Badge>}
                  </div>
                </div>
                {t.topicsCovered && <p className="text-xs text-muted-foreground mt-2">{t.topicsCovered}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p className="font-bold">{message}</p>
      <p className="text-sm mt-1">{sub}</p>
    </div>
  );
}
