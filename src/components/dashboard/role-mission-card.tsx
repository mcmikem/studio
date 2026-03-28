'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ShieldAlert, Users, Info } from 'lucide-react';
import type { User as UserProfileType } from '@/lib/types';

interface RoleContent {
  mission: string;
  kpis: string[];
  nonNegotiables: string[];
  reportsTo: string;
}

const roleData: Record<string, RoleContent> = {
  'Executive Director': {
    mission: 'Lead the vision, strategy, and overall impact of Omuto Foundation.',
    kpis: ['Strategic Partnerships established', 'Financial Sustainability (Burn Rate vs Funding)', 'Overall Impact Velocity across all 3 phases'],
    nonNegotiables: ['Integrity of the Omuto Brand', 'Weekly strategic sync with Board'],
    reportsTo: 'Board of Directors',
  },
  'Programs & Partnerships Manager': {
    mission: 'Ensure all programs are executed with high ROI and quality, and manage organizational partnerships.',
    kpis: ['Program Quality Index (Avg 80+)', 'Partnership Conversion Rate', 'Impact reporting accuracy'],
    nonNegotiables: ['Submission of monthly impact deep-dive', '24h response time to core partners'],
    reportsTo: 'Executive Director',
  },
  'Operations & Field Manager': {
    mission: 'Manage day-to-day field operations, team safety, and logistical efficiency.',
    kpis: ['Field Team Check-in/out Compliance', 'Equipment & Resource ROI', 'Operational Plan execution %'],
    nonNegotiables: ['Safety protocols strictly followed', 'Daily field check-ins with team'],
    reportsTo: 'Executive Director',
  },
  'Media & Finance Lead': {
    mission: 'Standardize the Omuto narrative through media and ensure financial transparency.',
    kpis: ['Media Reach/Engagement', 'Financial Reporting Speed', 'Accuracy of budget tracking'],
    nonNegotiables: ['Weekly financial reconciliation', 'Content quality standards'],
    reportsTo: 'Management Team',
  },
  'Intern': {
    mission: 'Learn while contributing high-quality data and field support to the team.',
    kpis: ['Task Completion Rate', 'Quality Index (Avg 70+)', 'Learning & growth progress'],
    nonNegotiables: ['Daily Check-in/Check-out', 'Active participation in AI Coach check-ins'],
    reportsTo: 'Field Coordinator / Operations Manager',
  },
  'Volunteer': {
    mission: 'Support field activities and community engagement with passion and integrity.',
    kpis: ['Community Engagement levels', 'Attendance at scheduled activities', 'Contribution to testimonies'],
    nonNegotiables: ['Respect for community residents', 'On-time arrival at field locations'],
    reportsTo: 'Programs Manager',
  },
  'Administrator': {
    mission: 'Maintain the digital ecosystem and ensure system accessibility for all staff.',
    kpis: ['System uptime', 'User support response time', 'Permission accuracy'],
    nonNegotiables: ['Data privacy & security', 'Regular database backups'],
    reportsTo: 'Executive Director',
  },
};

const defaultContent: RoleContent = {
  mission: 'Contribute to the Omuto Foundation ecosystem through your unique role.',
  kpis: ['Task consistency', 'High quality index', 'Positive team contribution'],
  nonNegotiables: ['Honesty and Integrity', 'Daily accountability'],
  reportsTo: 'Your Direct Supervisor',
};

export function RoleMissionCard({ profile }: { profile: UserProfileType }) {
  const content = roleData[profile.role] || defaultContent;

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="bg-omuto-navy text-white pb-6 pt-6 px-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Personnel Mission: {profile.role}</CardTitle>
            <CardDescription className="text-white/60 font-medium text-xs">Omuto Institutional Accountability</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Info className="h-3.5 w-3.5" /> Mission Statement
            </h3>
            <p className="text-sm font-semibold text-omuto-navy dark:text-white leading-relaxed">{content.mission}</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-primary" /> Core KPIs
                </h3>
                <ul className="space-y-2">
                    {content.kpis.map((kpi, i) => (
                        <li key={i} className="text-xs font-medium text-omuto-navy dark:text-white/80 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                            {kpi}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Non-Negotiables
                </h3>
                <ul className="space-y-2">
                    {content.nonNegotiables.map((nn, i) => (
                        <li key={i} className="text-xs font-medium text-omuto-navy dark:text-white/80 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                            {nn}
                        </li>
                    ))}
                </ul>
            </section>
        </div>

        <div className="pt-4 border-t flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Reporting To</div>
            <div className="text-[10px] font-bold text-omuto-navy dark:text-white uppercase tracking-wider">{content.reportsTo}</div>
        </div>
      </CardContent>
    </Card>
  );
}
