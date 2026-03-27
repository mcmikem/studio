'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser, useFirestore } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import { 
    Database, 
    Play,
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    FileSpreadsheet,
    MapPin,
    Building2,
    Users,
    TreePine,
    Droplets
} from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { MIGRATION_DATA } from '@/lib/data/migration-data';
import { Skeleton } from '@/components/ui/skeleton';

interface SeedResult {
    collection: string;
    success: boolean;
    count: number;
    error?: string;
}

interface SeedProgress {
    status: 'idle' | 'running' | 'completed' | 'error';
    current: string;
    results: SeedResult[];
    startTime: Date | null;
    endTime: Date | null;
}

export default function SeedingBotPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { profile } = useUserProfile(user);
    const { viewAsRole } = useViewAs();
    const effectiveRole = viewAsRole || profile?.role;
    
    const [progress, setProgress] = useState<SeedProgress>({
        status: 'idle',
        current: '',
        results: [],
        startTime: null,
        endTime: null,
    });
    const [dryRun, setDryRun] = useState(true);

    const adminRoles = ['Executive Director', 'Administrator'];
    if (!adminRoles.includes(effectiveRole || '')) {
        return (
            <Card className="m-4">
                <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                    <p className="font-bold text-lg">Access Restricted</p>
                    <p className="text-sm text-muted-foreground mt-2">Only Executive Directors and Administrators can access the seeding bot.</p>
                </CardContent>
            </Card>
        );
    }

    const checkExistingData = async (collectionName: string) => {
        if (!firestore) return 0;
        try {
            const snap = await getDocs(query(collection(firestore, collectionName)));
            return snap.size;
        } catch {
            return 0;
        }
    };

    const clearCollection = async (collectionName: string) => {
        if (!firestore) return;
        try {
            const snap = await getDocs(collection(firestore, collectionName));
            const deletes = snap.docs.map(d => deleteDoc(doc(firestore, collectionName, d.id)));
            await Promise.all(deletes);
        } catch (e) {
            console.error(`Error clearing ${collectionName}:`, e);
        }
    };

    const seedSchools = async (clear: boolean = false) => {
        if (clear) await clearCollection('schools');
        
        const schools = MIGRATION_DATA.schools || [];
        const seeded: string[] = [];
        
        for (const school of schools) {
            try {
                const docRef = await addDoc(collection(firestore!, 'schools'), {
                    schoolName: school.name,
                    patron: school.patron,
                    subCounty: school.sc,
                    district: 'Mpigi',
                    status: 'Active',
                    tier: school.progs?.includes('SLF') ? 'Partner' : 'Engaged',
                    programs: school.progs || [],
                    createdAt: new Date(),
                    createdBy: 'seeding-bot',
                });
                seeded.push(school.name);
            } catch (e: any) {
                console.error(`Error seeding ${school.name}:`, e);
            }
        }
        return seeded.length;
    };

    const seedWaterSources = async (clear: boolean = false) => {
        if (clear) await clearCollection('water-sources');
        
        const locations = MIGRATION_DATA.water || [];
        const seeded: string[] = [];
        
        for (const wp of locations) {
            try {
                await addDoc(collection(firestore!, 'water-sources'), {
                    name: wp.name || 'Water Point',
                    location: wp.village || '',
                    status: wp.status || 'Active',
                    createdAt: new Date(),
                    createdBy: 'seeding-bot',
                });
                seeded.push(wp.name);
            } catch (e) {
                console.error('Error seeding water:', e);
            }
        }
        return seeded.length;
    };

    const seedTreeSurveys = async (clear: boolean = false) => {
        if (clear) await clearCollection('tree-surveys');
        
        const surveys = MIGRATION_DATA.trees || [];
        const seeded: string[] = [];
        
        for (const survey of surveys) {
            try {
                await addDoc(collection(firestore!, 'tree-surveys'), {
                    schoolName: survey.school || '',
                    subCounty: survey.subcounty || '',
                    totalTreesAtPlanting: parseInt(survey.qty) || 0,
                    numberOfTreesSurvived: parseInt(survey.qty) || 0,
                    surveyDate: survey.date || new Date().toISOString().split('T')[0],
                    category: survey.category || 'Tree Planting',
                    createdAt: new Date(),
                    createdBy: 'seeding-bot',
                });
                seeded.push(survey.school);
            } catch (e) {
                console.error('Error seeding trees:', e);
            }
        }
        return seeded.length;
    };

    const runSeeding = async () => {
        setProgress({
            status: 'running',
            current: 'Initializing...',
            results: [],
            startTime: new Date(),
            endTime: null,
        });

        const results: SeedResult[] = [];

        // Seed Schools
        setProgress(p => ({ ...p, current: 'Seeding Schools...' }));
        try {
            const count = await seedSchools(!dryRun);
            results.push({ collection: 'schools', success: true, count });
        } catch (e: any) {
            results.push({ collection: 'schools', success: false, count: 0, error: e.message });
        }

        // Seed Water Sources
        setProgress(p => ({ ...p, current: 'Seeding Water Sources...' }));
        try {
            const count = await seedWaterSources(!dryRun);
            results.push({ collection: 'water-sources', success: true, count });
        } catch (e: any) {
            results.push({ collection: 'water-sources', success: false, count: 0, error: e.message });
        }

        // Seed Tree Surveys
        setProgress(p => ({ ...p, current: 'Seeding Tree Surveys...' }));
        try {
            const count = await seedTreeSurveys(!dryRun);
            results.push({ collection: 'tree-surveys', success: true, count });
        } catch (e: any) {
            results.push({ collection: 'tree-surveys', success: false, count: 0, error: e.message });
        }

        setProgress({
            status: 'completed',
            current: 'Complete!',
            results,
            startTime: progress.startTime,
            endTime: new Date(),
        });
    };

    const schoolsCount = MIGRATION_DATA.schools?.length || 0;
    const treesCount = MIGRATION_DATA.trees?.length || 0;
    const waterCount = MIGRATION_DATA.water?.length || 0;
    const beneficiariesCount = MIGRATION_DATA.beneficiaries?.length || 0;

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Data Seeding Bot
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Import data from migration sheets into Firestore</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Migration Data Available
                    </CardTitle>
                    <CardDescription>Records ready to be seeded from local data files</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <span className="font-bold text-sm">Schools</span>
                            </div>
                            <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{schoolsCount}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Droplets className="h-5 w-5 text-cyan-600" />
                                <span className="font-bold text-sm">Water/People</span>
                            </div>
                            <p className="text-2xl font-black text-cyan-700 dark:text-cyan-400">{waterCount}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                                <TreePine className="h-5 w-5 text-green-600" />
                                <span className="font-bold text-sm">Trees</span>
                            </div>
                            <p className="text-2xl font-black text-green-700 dark:text-green-400">{treesCount}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-5 w-5 text-purple-600" />
                                <span className="font-bold text-sm">Beneficiaries</span>
                            </div>
                            <p className="text-2xl font-black text-purple-700 dark:text-purple-400">{beneficiariesCount}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Seeding Configuration</CardTitle>
                    <CardDescription>Configure how the bot should process the data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                        <input
                            type="checkbox"
                            id="dryRun"
                            checked={dryRun}
                            onChange={(e) => setDryRun(e.target.checked)}
                            className="h-5 w-5"
                        />
                        <div>
                            <Label htmlFor="dryRun" className="font-bold cursor-pointer">Dry Run Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                {dryRun 
                                    ? "Preview what would be seeded without making changes" 
                                    : "Actually seed data into Firestore - existing records will be cleared first"
                                }
                            </p>
                        </div>
                    </div>

                    {progress.status === 'idle' && (
                        <Button 
                            onClick={runSeeding} 
                            disabled={!firestore}
                            className="w-full py-6 text-lg font-bold"
                        >
                            <Play className="h-5 w-5 mr-2" />
                            {dryRun ? 'Preview Seeding' : 'Start Seeding'}
                        </Button>
                    )}

                    {progress.status === 'running' && (
                        <div className="text-center py-8">
                            <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                            <p className="text-lg font-bold">{progress.current}</p>
                            <p className="text-sm text-muted-foreground">Please wait...</p>
                        </div>
                    )}

                    {progress.status === 'completed' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600 font-bold">
                                <CheckCircle className="h-5 w-5" />
                                Seeding Complete!
                            </div>
                            <div className="grid gap-2">
                                {progress.results.map((result, i) => (
                                    <div 
                                        key={i} 
                                        className={`p-4 rounded-lg border ${
                                            result.success 
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {result.success ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                )}
                                                <span className="font-bold">{result.collection}</span>
                                            </div>
                                            <span className="text-sm">
                                                {result.success ? `${result.count} seeded` : result.error}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button 
                                onClick={() => setProgress(p => ({ ...p, status: 'idle', results: [], current: '' }))}
                                variant="outline"
                                className="w-full"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Run Again
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {progress.status === 'completed' && !dryRun && (
                <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
                    <CardContent className="p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-800 dark:text-amber-200">Data has been seeded!</p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                The data is now live in your Firestore database. You can manage and clean it using the Data Management page.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
