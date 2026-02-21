
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, BarChart3, Users, CheckCircle, FileText, Swords, Leaf, Heart, Zap, Droplets, Store, Wind, Trophy, Building, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const programSections = [
    { href: '/meal/ofa', title: 'Omuto Football Alliance', icon: Swords, dataHref: '/meal/data/ofa', color: 'text-omuto-blue', bg: 'bg-omuto-blue/10' },
    { href: '/meal/red-campaign', title: 'RED Campaign', icon: Heart, dataHref: '/meal/data/red-campaign', color: 'text-omuto-red', bg: 'bg-omuto-red/10' },
    { href: '/meal/greenschools', title: 'GreenSchools', icon: Leaf, dataHref: '/meal/data/greenschools', color: 'text-omuto-teal', bg: 'bg-omuto-teal/10' },
    { href: '/meal/yoskills', title: 'YoSkills Entrepreneurship', icon: Zap, dataHref: '/meal/data/yoskills', color: 'text-omuto-yellow', bg: 'bg-omuto-yellow/10' },
    { href: '/meal/slf', title: 'Student Leaders Forum', icon: Users, dataHref: '/meal/data/slf', color: 'text-omuto-navy', bg: 'bg-omuto-navy/10' },
    { href: '/meal/purewater', title: 'PureWater Initiative', icon: Droplets, dataHref: '/meal/data/purewater', color: 'text-omuto-blue', bg: 'bg-omuto-blue/10' },
    { href: '/meal/yap', title: 'Youth Action Pathway', icon: Users, dataHref: '/meal/data/yap', color: 'text-omuto-gold', bg: 'bg-omuto-gold/10' },
    { href: '/meal/omuto-cup', title: 'Omuto Cup (Event)', icon: Trophy, dataHref: '/meal/data/omuto-cup', color: 'text-omuto-brown', bg: 'bg-omuto-brown/10' },
    { href: '/meal/essentials', title: 'Omuto Essentials', icon: Store, dataHref: '/meal/data/essentials', color: 'text-omuto-teal', bg: 'bg-omuto-teal/10' },
    { href: '/meal/pulse', title: 'Omuto Pulse', icon: Wind, dataHref: '/meal/data/pulse', color: 'text-omuto-gold', bg: 'bg-omuto-gold/10' },
];

export default function MealPage() {
    return (
        <div className="space-y-10 pb-10">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-omuto-navy">
                    <div className="p-3 bg-omuto-navy/10 rounded-2xl">
                        <BarChart3 className="h-8 w-8 text-omuto-red" />
                    </div>
                    <div>
                        <h1 className="font-heading text-4xl font-black tracking-tight">Impact <span className="text-omuto-red">Hub</span></h1>
                        <p className="text-omuto-navy/60 font-bold uppercase text-[10px] tracking-widest mt-1">Monitoring • Evaluation • Accountability • Learning</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-3 card-comic-hero overflow-hidden">
                    <CardHeader className="pb-6 bg-muted/30 border-b-lg border-omuto-navy/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tighter text-omuto-navy">Core <span className="text-omuto-red">M&E</span> Tools</CardTitle>
                                <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-widest mt-1">Primary data collection and impact tracking systems.</CardDescription>
                            </div>
                            <Badge className="badge-omuto-outline border-omuto-navy/10 text-omuto-navy/60">Cross-Cutting</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                        {[
                            { href: "/meal/beneficiary-registration", title: "Beneficiary Registry", icon: Users, desc: "Onboard new participants." },
                            { href: "/meal/attendance", title: "Session Attendance", icon: CheckCircle, desc: "Track daily reach." },
                            { href: "/meal/record-testimony", title: "Impact Story Capture", icon: Trophy, desc: "Document field success." },
                            { href: "/meal/activity", title: "Activity ROI Log", icon: BarChart3, desc: "Calculate social return." }
                        ].map((tool) => (
                            <Link key={tool.href} href={tool.href} className="group">
                                <div className="flex flex-col gap-4 p-6 card-comic-clean h-full">
                                    <div className="p-3 bg-omuto-cream rounded-2xl w-fit shadow-comic-sm group-hover:scale-110 transition-transform">
                                        <tool.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-omuto-navy">{tool.title}</p>
                                        <p className="text-[10px] text-omuto-navy/60 mt-1 font-bold leading-relaxed uppercase tracking-wide">{tool.desc}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-omuto-navy/30 mt-auto self-end group-hover:text-primary transition-colors group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="font-heading text-2xl font-black tracking-tighter uppercase text-omuto-navy">
                            Program <span className="text-omuto-red underline decoration-4 underline-offset-4">Channels</span>
                        </h2>
                        <span className="text-[10px] font-black uppercase text-omuto-navy/40 tracking-widest">Select a channel</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {programSections.map(program => (
                            <Card key={program.title} className="group relative overflow-hidden card-comic-clean hover:-translate-y-1">
                                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${program.color}`}>
                                    <program.icon className="h-12 w-12" />
                                </div>
                                <CardHeader className="pb-3 pt-6 px-6">
                                    <div className={`p-2 w-fit rounded-xl mb-3 ${program.bg} ${program.color}`}>
                                        <program.icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xs font-black leading-tight text-omuto-navy group-hover:text-primary transition-colors uppercase tracking-wider">{program.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2 p-6 pt-0">
                                    <Button asChild size="sm" className="btn-omuto-secondary h-9 rounded-lg">
                                        <Link href={program.href}>ADD DATA <ArrowRight className="h-3 w-3" /></Link>
                                    </Button>
                                    <Button asChild size="sm" className="btn-omuto bg-white text-omuto-navy/70 h-9 rounded-lg border-omuto-navy/10 shadow-comic-sm hover:bg-omuto-navy/20 hover:text-omuto-navy hover:border-omuto-navy/20">
                                        <Link href={program.dataHref}>VIEW DATA <ArrowRight className="h-3 w-3" /></Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card className="lg:col-span-3 card-comic-hero overflow-hidden">
                    <CardContent className="p-0">
                        <Link href="/forms/school" className="group block">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-10 hover:bg-omuto-cream/50 transition-colors">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-primary/10 border-lg border-omuto-navy/20 rounded-2xl group-hover:scale-105 transition-transform">
                                        <Building className="h-10 w-10 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-heading text-xl font-black tracking-tight text-omuto-navy">School Program <span className="text-primary">Intake</span></p>
                                        <p className="text-sm font-medium max-w-md text-omuto-navy/60 mt-1">Official application and onboarding system for new educational partners and schools.</p>
                                    </div>
                                </div>
                                <div className="btn-omuto-secondary h-14 px-8 text-sm rounded-xl shadow-comic transition-all group-hover:-translate-y-0.5">
                                    OPEN APPLICATION HUB <ArrowRight className="h-5 w-5" />
                                </div>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
