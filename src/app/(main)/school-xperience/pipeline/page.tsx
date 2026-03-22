'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  Plus,
  GraduationCap,
  Heart,
  Flower2,
  Droplets,
  Star,
  Phone,
  Mail,
  CheckSquare,
  Square,
  ArrowRight,
  X,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SchoolXperience } from '@/lib/types';

const PIPELINE_STAGES = [
  { id: 'Inquiry', label: 'Inquiry', color: 'text-gray-500', border: 'border-gray-200', bg: 'bg-gray-50' },
  { id: 'Meeting Booked', label: 'Meeting Booked', color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50' },
  { id: 'MOU Signed', label: 'MOU Signed', color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50' },
  { id: 'Onboarded', label: 'Onboarded', color: 'text-green-600', border: 'border-green-200', bg: 'bg-green-50' },
] as const;

const PROGRAMME_ICONS: Record<string, React.ElementType> = {
  SLF: GraduationCap,
  RED: Heart,
  GreenSchools: Flower2,
  PureWater: Droplets,
};

const TIER_COLORS: Record<string, string> = {
  Partner: 'bg-blue-100 text-blue-700',
  Active: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-orange-100 text-orange-700',
  Flagship: 'bg-green-100 text-green-700',
};

export default function RegistrationPipelinePage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState<string>('');

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: schools, isLoading } = useCollection<SchoolXperience>(schoolsQuery);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInStage = (stage: string) => {
    const stageSchools = filtered(stage);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      stageSchools.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const applyBulkStage = () => {
    if (!bulkStage || selectedIds.size === 0 || !firestore) return;
    const count = selectedIds.size;
    selectedIds.forEach((id) => {
      updateDocumentNonBlocking(doc(firestore, 'sx-schools', id), {
        pipelineStage: bulkStage,
      });
    });
    toast({ title: `${count} school${count > 1 ? 's' : ''} moved to ${bulkStage}` });
    setSelectedIds(new Set());
    setBulkStage('');
  };

  const filtered = (stageFilter: string) => {
    if (!schools) return [];
    const base = activeTab === 'All'
      ? schools
      : schools.filter((s) => s.activeProgrammes?.includes(activeTab as any));
    if (stageFilter === 'All') return base;
    return base.filter((s) => s.pipelineStage === stageFilter);
  };

  const pipelineSchools = filtered('Onboarded');
  const otherSchools = [
    ...filtered('Inquiry'),
    ...filtered('Meeting Booked'),
    ...filtered('MOU Signed'),
  ];

  const totalPipeline = otherSchools.length;
  const onboardedCount = pipelineSchools.length;

  const stageCounts = {
    Inquiry: filtered('Inquiry').length,
    'Meeting Booked': filtered('Meeting Booked').length,
    'MOU Signed': filtered('MOU Signed').length,
    Onboarded: onboardedCount,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Building2}
        title="Registration Pipeline"
        description="Track schools from first inquiry through to full onboarding. Filter by programme."
        breadcrumbs={[
          { name: 'Dashboard', href: '/' },
          { name: 'School Xperience', href: '/school-xperience' },
          { name: 'Pipeline', href: '/school-xperience/pipeline' },
        ]}
      />

      <div className="bg-white rounded-2xl border-lg border-omuto-navy/20 p-5 shadow-comic-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-omuto-red" />
          <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Pipeline Funnel</span>
          <Button asChild size="sm" className="ml-auto h-8 rounded-xl text-[10px] font-black btn-omuto">
            <Link href="/school-xperience/register-school">
              <Plus className="mr-1 h-3 w-3" />
              Register School
            </Link>
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto">
          {PIPELINE_STAGES.map((stage, i) => {
            const count = stageCounts[stage.id as keyof typeof stageCounts] || 0;
            const total = schools?.length || 1;
            const pct = Math.round((count / total) * 100);
            const isLast = i === PIPELINE_STAGES.length - 1;
            return (
              <div key={stage.id} className="flex items-center gap-0">
                <div className={`flex flex-col items-center p-3 rounded-xl border-2 min-w-[80px] ${stage.border} ${stage.bg}`}>
                  <p className={`font-black text-xl ${stage.color}`}>{count}</p>
                  <div className={`w-full h-1.5 rounded-full mt-1 ${stage.bg}`}>
                    <div className={`h-full rounded-full ${stage.color.replace('text-', 'bg-')}`} style={{ width: `${Math.max(pct, 5)}%` }} />
                  </div>
                  <p className={`text-[9px] font-black uppercase mt-1 ${stage.color}`}>{stage.label}</p>
                </div>
                {!isLast && (
                  <ChevronRight className={`h-4 w-4 mx-1 flex-shrink-0 ${stage.color}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-muted-foreground">
          <span>Total: <strong className="text-omuto-navy">{schools?.length || 0}</strong> schools</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Onboarded: <strong className="text-green-600">{onboardedCount}</strong></span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />In progress: <strong className="text-gray-600">{totalPipeline}</strong></span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeTab === 'All' ? 'default' : 'outline'}
            className="h-8 rounded-xl px-3 font-bold text-xs cursor-pointer"
            onClick={() => setActiveTab('All')}
          >
            All
          </Badge>
          <Badge
            variant={activeTab === 'SLF' ? 'default' : 'outline'}
            className="h-8 rounded-xl px-3 font-bold text-xs cursor-pointer"
            onClick={() => setActiveTab('SLF')}
          >
            <GraduationCap className="mr-1 h-3 w-3" /> SLF
          </Badge>
          <Badge
            variant={activeTab === 'RED' ? 'default' : 'outline'}
            className="h-8 rounded-xl px-3 font-bold text-xs cursor-pointer"
            onClick={() => setActiveTab('RED')}
          >
            <Heart className="mr-1 h-3 w-3" /> RED
          </Badge>
          <Badge
            variant={activeTab === 'GreenSchools' ? 'default' : 'outline'}
            className="h-8 rounded-xl px-3 font-bold text-xs cursor-pointer"
            onClick={() => setActiveTab('GreenSchools')}
          >
            <Flower2 className="mr-1 h-3 w-3" /> GreenSchools
          </Badge>
          <Badge
            variant={activeTab === 'PureWater' ? 'default' : 'outline'}
            className="h-8 rounded-xl px-3 font-bold text-xs cursor-pointer"
            onClick={() => setActiveTab('PureWater')}
          >
            <Droplets className="mr-1 h-3 w-3" /> PureWater
          </Badge>
        </div>
        <Button asChild className="btn-omuto h-10 rounded-xl text-xs font-black uppercase tracking-widest shadow-comic-sm">
          <Link href="/school-xperience/register-school">
            <Plus className="mr-2 h-4 w-4" />
            Register School
          </Link>
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <Card className="border-primary/30 bg-primary/5 shadow-comic-sm sticky top-20 z-10">
          <CardContent className="p-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">{selectedIds.size} selected</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearSelection}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Move to:</span>
              <select
                value={bulkStage}
                onChange={(e) => setBulkStage(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-2 text-xs font-bold"
              >
                <option value="">Select stage...</option>
                <option value="Inquiry">Inquiry</option>
                <option value="Meeting Booked">Meeting Booked</option>
                <option value="MOU Signed">MOU Signed</option>
                <option value="Onboarded">Onboarded</option>
              </select>
              <Button
                size="sm"
                className="h-9 rounded-lg text-xs font-bold btn-omuto"
                disabled={!bulkStage}
                onClick={applyBulkStage}
              >
                <ArrowRight className="mr-1 h-3 w-3" />
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const schoolsInStage = stage.id === 'Onboarded' ? pipelineSchools : otherSchools.filter((s) => s.pipelineStage === stage.id);
          return (
            <div key={stage.id} className={`flex-shrink-0 w-full sm:w-80 rounded-2xl border-2 ${stage.border} ${stage.bg}`}>
              <div className={`p-3 border-b-2 ${stage.border}`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-black text-xs uppercase tracking-widest ${stage.color}`}>{stage.label}</h3>
                  <Badge variant="outline" className={`font-black text-xs ${stage.color}`}>{schoolsInStage.length}</Badge>
                </div>
                {schoolsInStage.length > 1 && (
                  <button
                    onClick={() => selectAllInStage(stage.id)}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground underline"
                  >
                    Select all {schoolsInStage.length}
                  </button>
                )}
              </div>
              <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  [1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)
                ) : schoolsInStage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">No schools</p>
                  </div>
                ) : (
                  schoolsInStage.map((school) => (
                    <SchoolCard
                      key={school.id}
                      school={school}
                      selected={selectedIds.has(school.id)}
                      onToggle={() => toggleSelect(school.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPipeline > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>{totalPipeline} schools in pipeline</span>
          <ChevronRight className="h-4 w-4" />
          <span>{onboardedCount} onboarded</span>
          <span className="text-xs">— {((onboardedCount / Math.max(onboardedCount + totalPipeline, 1)) * 100).toFixed(0)}% conversion</span>
        </div>
      )}
    </div>
  );
}

function SchoolCard({ school, selected, onToggle }: { school: SchoolXperience; selected?: boolean; onToggle?: () => void }) {
  return (
    <Card className={`border shadow-sm hover:shadow-md transition-all ${selected ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <button
            onClick={onToggle}
            className="mt-0.5 flex-shrink-0"
            aria-label={selected ? 'Deselect' : 'Select'}
          >
            {selected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm line-clamp-1">{school.schoolName}</h4>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" asChild>
            <Link href={`/school-xperience/${school.id}`}>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {school.location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground pl-7">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{school.location}</span>
          </p>
        )}

        {school.patronTeacher && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground pl-7">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{school.patronTeacher}</span>
          </p>
        )}

        {school.patronPhone && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground pl-7">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>{school.patronPhone}</span>
          </p>
        )}

        {school.patronEmail && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground pl-7">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{school.patronEmail}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-1 pt-1 pl-7">
          {school.activeProgrammes?.map((p) => {
            const Icon = PROGRAMME_ICONS[p] || Star;
            return (
              <Badge key={p} variant="outline" className="text-xs font-bold gap-0.5 py-0 h-5">
                <Icon className="h-2.5 w-2.5" />
                {p}
              </Badge>
            );
          })}
        </div>

        {school.tier && (
          <Badge className={`text-xs font-bold ml-7 ${TIER_COLORS[school.tier] || ''}`}>
            {school.tier}
          </Badge>
        )}

        <div className="pt-1 pl-7">
          <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs font-bold" asChild>
            <Link href={`/school-xperience/${school.id}`}>
              View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
