'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import Link from 'next/link';
import { 
    Briefcase, 
    Handshake, 
    FolderKanban, 
    Receipt, 
    Users, 
    FileSignature, 
    ArrowRight, 
    TrendingUp, 
    Activity,
    ShieldCheck,
    Zap,
    Clock
} from 'lucide-react';
import { collection, query, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManagementPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { profile } = useUserProfile(user);
    const { viewAsRole } = useViewAs();
    
    const effectiveRole = viewAsRole || profile?.role;

    // Fetch live metrics for the pulse
    const projectsQuery = useMemo(() => firestore ? query(collection(firestore, 'projects'), limit(50)) : null, [firestore]);
    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs'), limit(50)) : null, [firestore]);
    const expensesQuery = useMemo(() => firestore ? query(collection(firestore, 'expenses'), limit(50)) : null, [firestore]);

    const { data: projects, isLoading: projectsLoading } = useCollection<any>(projectsQuery);
    const { data: programs, isLoading: programsLoading } = useCollection<any>(programsQuery);
    const { data: expenses, isLoading: expensesLoading } = useCollection<any>(expensesQuery);

    const managementRoles = [
        'Administrator', 
        'Executive Director', 
        'Programs & Partnerships Manager', 
        'Operations & Field Manager',
        'Media & Finance Lead',
        'Media & Communications Lead',
        'Resource Mobilization Lead',
    ];

    if (!managementRoles.includes(effectiveRole || '')) {
        return null; // The layout already handles the access denied message.
    }

    const modules = [
        { 
            name: 'Programs', 
            href: '/management/programs', 
            icon: FolderKanban, 
            description: 'Core impact initiatives',
            metric: programsLoading ? '—' : `${programs?.length || 0} Active`,
            trend: "Strategic tracking",
            variant: "indigo"
        },
        { 
            name: 'Projects', 
            href: '/management/projects', 
            icon: Briefcase, 
            description: 'Time-bound operations',
            metric: projectsLoading ? '—' : `${projects?.length || 0} Running`,
            trend: "On schedule",
            variant: "blue"
        },
        { 
            name: 'Partnerships', 
            href: '/management/partnerships', 
            icon: Handshake, 
            description: 'CRM & Pipeline',
            metric: "12 Partners",
            trend: "Network growth",
            variant: "amber"
        },
        { 
            name: 'Finance & Expenses', 
            href: '/management/finance', 
            icon: Receipt, 
            description: 'Reconciliations & Approvals',
            metric: expensesLoading ? '—' : `${expenses?.filter(e => e.status === 'Pending').length || 0} Pending`,
            trend: "Budget control",
            variant: "emerald"
        },
        { 
            name: 'Team & Users', 
            href: '/management/users', 
            icon: Users, 
            description: 'Access & Roles',
            metric: "14 Staff",
            trend: "Permissions live",
            variant: "slate"
        },
        { 
            name: 'Strategy (OPS)', 
            href: '/management/operational-plan', 
            icon: FileSignature, 
            description: 'Organizational KPIs',
            metric: "2026/Q1",
            trend: "Plan active",
            variant: "primary"
        },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Management Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-omuto-navy text-white rounded-xl shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <h2 className="font-heading text-xl font-black uppercase tracking-tighter text-omuto-navy">Operations Desk</h2>
                    </div>
                    <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tighter text-omuto-navy leading-none">
                        Management <span className="text-primary italic">Pulse.</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm border-2 border-omuto-navy/5 p-4 rounded-[1.5rem] shadow-sm">
                    <div className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40 leading-none">Global Sync Status</p>
                        <p className="font-bold text-xs text-omuto-navy">Systems Operational</p>
                    </div>
                </div>
            </div>

            {/* Management Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <Link key={module.href} href={module.href} className="group">
                        <Card className="relative h-full overflow-hidden border-2 border-omuto-navy/5 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-comic-sm group-hover:border-omuto-navy/20 rounded-[2rem]">
                            {/* Decorative Corner Element */}
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                            
                            <CardContent className="p-8 h-full flex flex-col relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-muted/50 rounded-2xl text-omuto-navy group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm ring-4 ring-muted/20 group-hover:ring-primary/10">
                                        <module.icon className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-omuto-navy/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>

                                <div className="space-y-1 mb-6">
                                    <h3 className="font-heading text-xl font-black text-omuto-navy uppercase tracking-tight">{module.name}</h3>
                                    <p className="text-xs font-medium text-omuto-navy/50 leading-tight pr-4">{module.description}</p>
                                </div>

                                <div className="mt-auto pt-6 border-t border-omuto-navy/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-omuto-navy/30 mb-1">Live Metric</p>
                                        <p className="font-heading text-2xl font-black text-omuto-navy leading-none">{module.metric}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 uppercase text-[9px] font-black tracking-wider text-emerald-600">
                                            <Activity className="h-3 w-3" />
                                            {module.trend}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-lg border-primary/20 bg-primary/5 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="p-3 bg-primary text-white rounded-2xl">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-heading text-lg font-black text-omuto-navy uppercase tracking-tight">Need a Report?</h4>
                        <p className="text-xs font-bold text-omuto-navy/60">Generate instant PDF summaries for stakeholders.</p>
                    </div>
                    <Button variant="outline" className="ml-auto border-2 border-primary/20 bg-white rounded-xl font-black text-[10px] uppercase">Export Center</Button>
                </Card>

                <Card className="border-lg border-amber-500/20 bg-amber-500/5 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="p-3 bg-amber-500 text-white rounded-2xl">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-heading text-lg font-black text-omuto-navy uppercase tracking-tight">Audit Trail</h4>
                        <p className="text-xs font-bold text-omuto-navy/60">Review recent management changes and approvals.</p>
                    </div>
                    <Button variant="outline" className="ml-auto border-2 border-amber-500/20 bg-white rounded-xl font-black text-[10px] uppercase">View Logs</Button>
                </Card>
            </div>
        </div>
    );
}
