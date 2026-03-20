'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
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
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<string>('All');

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: schools, isLoading } = useCollection<SchoolXperience>(schoolsQuery);

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

      <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const schoolsInStage = stage.id === 'Onboarded' ? pipelineSchools : otherSchools.filter((s) => s.pipelineStage === stage.id);
          return (
            <div key={stage.id} className={`flex-shrink-0 w-full sm:w-80 rounded-2xl border-2 ${stage.border} ${stage.bg}`}>
              <div className={`p-4 border-b-2 ${stage.border}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-black text-sm uppercase tracking-widest ${stage.color}`}>{stage.label}</h3>
                  <Badge variant="outline" className={`font-black text-xs ${stage.color}`}>{schoolsInStage.length}</Badge>
                </div>
              </div>
              <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  [1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)
                ) : schoolsInStage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">No schools</p>
                  </div>
                ) : (
                  schoolsInStage.map((school) => (
                    <SchoolCard key={school.id} school={school} />
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

function SchoolCard({ school }: { school: SchoolXperience }) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-sm line-clamp-1">{school.schoolName}</h4>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" asChild>
            <Link href={`/school-xperience/${school.id}`}>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {school.location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{school.location}</span>
          </p>
        )}

        {school.patronTeacher && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{school.patronTeacher}</span>
          </p>
        )}

        {school.patronPhone && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>{school.patronPhone}</span>
          </p>
        )}

        {school.patronEmail && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{school.patronEmail}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-1 pt-1">
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
          <Badge className={`text-xs font-bold ${TIER_COLORS[school.tier] || ''}`}>
            {school.tier}
          </Badge>
        )}

        <div className="pt-1">
          <Button size="sm" variant="outline" className="w-full h-7 rounded-lg text-xs font-bold" asChild>
            <Link href={`/school-xperience/${school.id}`}>
              View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
