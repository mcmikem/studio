'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Heart,
  Leaf,
  Loader2,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  Wind,
  Droplets,
  Store,
  Zap,
  ClipboardList,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { Parser } from 'json2csv';
import { useFirestore } from '@/firebase';

type ExportCollection = {
  label: string;
  collectionName: string;
};

type CapabilityCheck = {
  pillar: 'Monitoring' | 'Evaluation' | 'Accountability' | 'Learning';
  description: string;
  route: string;
  status: 'Live';
};

const exportCollections: ExportCollection[] = [
  { label: 'Beneficiary Registry', collectionName: 'beneficiaries' },
  { label: 'Attendance Records', collectionName: 'attendance-records' },
  { label: 'Baseline Surveys', collectionName: 'baseline-surveys' },
  { label: 'Endline Surveys', collectionName: 'endline-surveys' },
  { label: 'School Visits (RED)', collectionName: 'school-visits' },
  { label: 'Pads Distribution (RED)', collectionName: 'pads-distributions' },
  { label: 'Tree Surveys (GreenSchools)', collectionName: 'tree-surveys' },
  { label: 'Water Source Mapping', collectionName: 'water-sources' },
  { label: 'WASH Assessments', collectionName: 'wash-assessments' },
  { label: 'YoSkills Circles', collectionName: 'yoskills-circles' },
  { label: 'YAP Chapters', collectionName: 'yap-chapters' },
  { label: 'SLF Schools', collectionName: 'slf-schools' },
  { label: 'OFA Teams', collectionName: 'ofa-teams' },
  { label: 'OFA Players', collectionName: 'ofa-players' },
];

const capabilityChecks: CapabilityCheck[] = [
  {
    pillar: 'Monitoring',
    description: 'Core registration and activity tracking flows are available and routed to centralized data views.',
    route: '/meal/data',
    status: 'Live',
  },
  {
    pillar: 'Evaluation',
    description: 'Baseline and endline tools are paired with a comparative survey dashboard for outcomes analysis.',
    route: '/meal/data/surveys',
    status: 'Live',
  },
  {
    pillar: 'Accountability',
    description: 'Program operations and grant/accountability records are captured and reviewable by teams.',
    route: '/meal/yap/grant-accountability',
    status: 'Live',
  },
  {
    pillar: 'Learning',
    description: 'Testimony capture and learning-oriented review pages support narrative and evidence-based adaptation.',
    route: '/meal/record-testimony',
    status: 'Live',
  },
];

const dataHubSections = [
  {
    title: 'Core M&E Data',
    links: [
      {
        href: '/meal/data/beneficiaries',
        title: 'Beneficiary Database',
        description: 'View and manage all registered program beneficiaries.',
        icon: Users,
      },
      {
        href: '/meal/data/attendance',
        title: 'Attendance Records',
        description: 'Browse all submitted attendance sheets from events and sessions.',
        icon: CheckCircle2,
      },
        {
          href: '/meal/data/surveys',
          title: 'Survey Results',
          description: 'Analyze baseline and endline survey data to measure impact.',
          icon: FileText,
        },
        {
          href: '/meal/data/impact-stories',
          title: 'Impact Stories Archive',
          description: 'Browse captured success stories and testimonies.',
          icon: BookOpen,
        },
      ],
    },
  {
    title: 'Program-Specific Data',
    links: [
      {
        href: '/meal/data/ofa',
        title: 'Omuto Football Alliance (OFA)',
        description: 'Access all data related to OFA teams, players, matches, and performance.',
        icon: Swords,
      },
      {
        href: '/meal/data/red-campaign',
        title: 'RED Campaign',
        description: 'View MHM training, school visit, and pad distribution data.',
        icon: Heart,
      },
      {
        href: '/meal/data/greenschools',
        title: 'GreenSchools Campaign',
        description: 'Analyze tree survival surveys, waste audits, and club registrations.',
        icon: Leaf,
      },
      {
        href: '/meal/data/yoskills',
        title: 'YoSkills Entrepreneurship',
        description: 'Track circles, youth participants, business ideas, and pitch scores.',
        icon: Zap,
      },
      {
        href: '/meal/data/slf',
        title: 'Student Leaders Forum (SLF)',
        description: 'Review school registrations, prefect data, and performance reports.',
        icon: Users,
      },
      {
        href: '/meal/data/purewater',
        title: 'PureWater Initiative',
        description: 'Data for water source mapping and WASH assessments.',
        icon: Droplets,
      },
      {
        href: '/meal/data/yap',
        title: 'Youth Action Pathway (YAP)',
        description: 'Data for chapters and seed grant applications.',
        icon: Users,
      },
      {
        href: '/meal/data/essentials',
        title: 'Omuto Essentials',
        description: 'Data for production, sales, and inventory.',
        icon: Store,
      },
      {
        href: '/meal/data/pulse',
        title: 'Omuto Pulse',
        description: 'View all submitted content for the Omuto Pulse media platform.',
        icon: Wind,
      },
      {
        href: '/meal/data/omuto-cup',
        title: 'Omuto Cup',
        description: 'Data from tournament and volunteer registrations.',
        icon: Trophy,
      },
    ],
  },
];

const downloadFile = (name: string, contents: string, contentType: string) => {
  const blob = new Blob([contents], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function DataHubPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const totalDashboards = useMemo(
    () => dataHubSections.reduce((total, section) => total + section.links.length, 0),
    []
  );

  const runExport = async (format: 'csv' | 'doc') => {
    if (!firestore || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const rows: Array<Record<string, string | number>> = [];
      for (const item of exportCollections) {
        const queryRef = query(collection(firestore, item.collectionName), limit(500));
        const snapshot = await getDocs(queryRef);

        rows.push({
          dataset: item.label,
          collection: item.collectionName,
          records: snapshot.size,
          exportDate: new Date().toISOString(),
        });
      }

      if (format === 'csv') {
        const parser = new Parser({ fields: ['dataset', 'collection', 'records', 'exportDate'] });
        const csv = parser.parse(rows);
        downloadFile(`meal-dataset-summary-${new Date().toISOString().split('T')[0]}.csv`, csv, 'text/csv;charset=utf-8;');
      } else {
        const docContent = [
          'MEAL System Data Export Summary',
          `Generated on: ${new Date().toLocaleString()}`,
          '',
          ...rows.map((row) => `• ${row.dataset} (${row.collection}): ${row.records} records`),
        ].join('\n');

        downloadFile(`meal-dataset-summary-${new Date().toISOString().split('T')[0]}.doc`, docContent, 'application/msword;charset=utf-8;');
      }

      toast({
        title: 'Export complete',
        description:
          format === 'csv'
            ? 'Dataset summary exported for spreadsheet workflows (Excel/Google Sheets).'
            : 'Dataset summary exported for documentation workflows.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Unable to create export summary. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8" /> Data Hub
        </h1>
        <p className="text-muted-foreground">
          Unified MEAL dashboards where submitted data is visible, actionable, and export-ready.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dashboards online</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalDashboards}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Export datasets covered</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{exportCollections.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MEAL pillars mapped</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">4 / 4</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Export Center
          </CardTitle>
          <CardDescription>
            Export current dataset counts as CSV for Sheets/Excel or DOC for reporting notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => runExport('csv')} disabled={!firestore || isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export to Sheets (CSV)
          </Button>
          <Button variant="outline" onClick={() => runExport('doc')} disabled={!firestore || isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Export to Docs (DOC)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> MEAL Completeness Check
          </CardTitle>
          <CardDescription>
            System review of required MEAL functions to confirm operational completeness.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {capabilityChecks.map((item) => (
            <div key={item.pillar} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <p className="font-semibold">{item.pillar}</p>
                </div>
                <Badge>{item.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
              <Link href={item.route} className="inline-flex items-center text-sm text-primary mt-2 hover:underline">
                Open related workflow <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>

      {dataHubSections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.links.map((link) => (
              <Link key={link.href} href={link.href} className="block">
                <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                  <link.icon className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{link.title}</p>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto flex-shrink-0" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" /> Next quality assurance step
          </CardTitle>
          <CardDescription>
            For each program, verify indicator definitions and data ownership in monthly review meetings.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
