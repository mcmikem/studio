'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    Upload,
    FileJson,
    FileText,
    Copy,
    Clipboard,
    Building2,
    Users,
    TreePine,
    Droplets
} from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { MIGRATION_DATA } from '@/lib/data/migration-data';

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
}

type InputMode = 'migration' | 'paste' | 'upload';

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
    });
    const [dryRun, setDryRun] = useState(true);
    const [inputMode, setInputMode] = useState<InputMode>('migration');
    const [pastedData, setPastedData] = useState('');
    const [parseError, setParseError] = useState('');
    const [selectedFileData, setSelectedFileData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const seedFromData = async (data: any, clear: boolean = false) => {
        const results: SeedResult[] = [];
        
        // Schools
        if (data.schools?.length) {
            setProgress(p => ({ ...p, current: 'Seeding Schools...' }));
            if (clear) await clearCollection('schools');
            let count = 0;
            for (const school of data.schools) {
                try {
                    await addDoc(collection(firestore!, 'schools'), {
                        schoolName: school.name || school.schoolName || school.school_name,
                        patron: school.patron || school.head_teacher || school.headTeacher || 'Head Teacher',
                        subCounty: school.subcounty || school.sc || school.subCounty,
                        district: school.district || 'Mpigi',
                        status: school.status || 'Active',
                        tier: school.tier || school.progs?.includes('SLF') ? 'Partner' : 'Engaged',
                        programs: school.progs || school.programs || school.prog || [],
                        createdAt: new Date(),
                        createdBy: 'seeding-bot',
                    });
                    count++;
                } catch (e) { console.error('Error:', e); }
            }
            results.push({ collection: 'schools', success: true, count });
        }

        // Water Sources
        if (data.water?.length || data.waterSources?.length || data.water_points?.length) {
            setProgress(p => ({ ...p, current: 'Seeding Water Sources...' }));
            const waterData = data.water || data.waterSources || data.water_points || [];
            if (clear) await clearCollection('water-sources');
            let count = 0;
            for (const wp of waterData) {
                try {
                    await addDoc(collection(firestore!, 'water-sources'), {
                        name: wp.name || wp.water_point_name || wp.waterPointName || 'Water Point',
                        location: wp.location || wp.village || wp.subCounty,
                        subCounty: wp.subCounty || wp.subcounty || wp.sc,
                        district: wp.district || 'Mpigi',
                        type: wp.type || wp.water_type || 'Protected Spring',
                        status: wp.status || 'Active',
                        beneficiaries: wp.beneficiaries || wp.beneficiaries_served || 0,
                        createdAt: new Date(),
                        createdBy: 'seeding-bot',
                    });
                    count++;
                } catch (e) { console.error('Error:', e); }
            }
            results.push({ collection: 'water-sources', success: true, count });
        }

        // Trees
        if (data.trees?.length || data.treeSurveys?.length || data.tree_surveys?.length) {
            setProgress(p => ({ ...p, current: 'Seeding Tree Surveys...' }));
            const treeData = data.trees || data.treeSurveys || data.tree_surveys || [];
            if (clear) await clearCollection('tree-surveys');
            let count = 0;
            for (const tree of treeData) {
                try {
                    await addDoc(collection(firestore!, 'tree-surveys'), {
                        schoolName: tree.school || tree.schoolName || tree.school_name,
                        subCounty: tree.subcounty || tree.subCounty || tree.sc,
                        district: tree.district || 'Mpigi',
                        totalTreesAtPlanting: parseInt(tree.qty || tree.quantity || tree.trees_planted || tree.trees || 0),
                        numberOfTreesSurvived: parseInt(tree.survived || tree.trees_survived || tree.qty || tree.quantity || 0),
                        surveyDate: tree.date || tree.survey_date || new Date().toISOString().split('T')[0],
                        category: tree.category || 'Tree Planting',
                        createdAt: new Date(),
                        createdBy: 'seeding-bot',
                    });
                    count++;
                } catch (e) { console.error('Error:', e); }
            }
            results.push({ collection: 'tree-surveys', success: true, count });
        }

        // Beneficiaries
        if (data.beneficiaries?.length) {
            setProgress(p => ({ ...p, current: 'Seeding Beneficiaries...' }));
            if (clear) await clearCollection('beneficiaries');
            let count = 0;
            for (const ben of data.beneficiaries) {
                try {
                    await addDoc(collection(firestore!, 'beneficiaries'), {
                        name: ben.name || ben.beneficiary_name,
                        gender: ben.gender || ben.sex,
                        age: ben.age || ben.beneficiary_age,
                        school: ben.school || ben.schoolName,
                        program: ben.program || ben.prog || ben.programs,
                        subCounty: ben.subcounty || ben.subCounty,
                        district: ben.district || 'Mpigi',
                        status: ben.status || 'Active',
                        createdAt: new Date(),
                        createdBy: 'seeding-bot',
                    });
                    count++;
                } catch (e) { console.error('Error:', e); }
            }
            results.push({ collection: 'beneficiaries', success: true, count });
        }

        return results;
    };

    const parsePastedData = () => {
        setParseError('');
        try {
            const parsed = JSON.parse(pastedData);
            setSelectedFileData(parsed);
            setInputMode('paste');
        } catch (e) {
            // Try to parse as simple text (one item per line)
            const lines = pastedData.trim().split('\n').filter(l => l.trim());
            if (lines.length > 0) {
                // Try to detect if it's school names
                const schools = lines.map(line => ({
                    name: line.trim(),
                    patron: 'Head Teacher',
                    status: 'Active'
                }));
                setSelectedFileData({ schools });
                setInputMode('paste');
            } else {
                setParseError('Could not parse the pasted data. Please use valid JSON format.');
            }
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (file.name.endsWith('.json')) {
                    const parsed = JSON.parse(content);
                    setSelectedFileData(parsed);
                } else if (file.name.endsWith('.csv')) {
                    // Parse CSV
                    const lines = content.trim().split('\n');
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
                    const schools = lines.slice(1).map(line => {
                        const values = line.split(',');
                        const obj: any = {};
                        headers.forEach((h, i) => { obj[h] = values[i]?.trim(); });
                        return obj;
                    });
                    setSelectedFileData({ schools });
                } else {
                    setParseError('Unsupported file type. Please use .json or .csv files.');
                }
            } catch (err) {
                setParseError('Failed to parse file: ' + (err as Error).message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const runSeeding = async () => {
        setProgress({
            status: 'running',
            current: 'Initializing...',
            results: [],
        });

        let dataToSeed = selectedFileData;
        let results: SeedResult[] = [];

        if (inputMode === 'migration') {
            dataToSeed = MIGRATION_DATA;
        } else if (inputMode === 'paste' || inputMode === 'upload') {
            dataToSeed = selectedFileData;
        }

        if (dataToSeed) {
            results = await seedFromData(dataToSeed, !dryRun);
        }

        setProgress({
            status: 'completed',
            current: 'Complete!',
            results,
        });
    };

    const schoolsCount = MIGRATION_DATA.schools?.length || 0;
    const treesCount = MIGRATION_DATA.trees?.length || 0;
    const waterCount = MIGRATION_DATA.water?.length || 0;
    const beneficiariesCount = MIGRATION_DATA.beneficiaries?.length || 0;
    
    const parsedCount = selectedFileData ? 
        (selectedFileData.schools?.length || selectedFileData.trees?.length || selectedFileData.water?.length || 0) : 0;

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    <Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    Data Seeding Bot
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Import data from migration files, pasted JSON, or CSV uploads</p>
            </div>

            {/* Input Mode Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Data Source</CardTitle>
                    <CardDescription>Choose how to input data for seeding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            variant={inputMode === 'migration' ? 'default' : 'outline'} 
                            onClick={() => { setInputMode('migration'); setSelectedFileData(null); }}
                            className="gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Built-in Data
                        </Button>
                        <Button 
                            variant={inputMode === 'paste' ? 'default' : 'outline'} 
                            onClick={() => { setInputMode('paste'); setSelectedFileData(null); }}
                            className="gap-2"
                        >
                            <Clipboard className="h-4 w-4" />
                            Paste JSON
                        </Button>
                        <Button 
                            variant={inputMode === 'upload' ? 'default' : 'outline'} 
                            onClick={() => { setInputMode('upload'); setSelectedFileData(null); }}
                            className="gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Upload File
                        </Button>
                    </div>

                    {inputMode === 'migration' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
                                <Building2 className="h-5 w-5 text-blue-600 mb-2" />
                                <p className="font-bold text-sm">Schools</p>
                                <p className="text-2xl font-black text-blue-700">{schoolsCount}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200">
                                <Droplets className="h-5 w-5 text-cyan-600 mb-2" />
                                <p className="font-bold text-sm">Water</p>
                                <p className="text-2xl font-black text-cyan-700">{waterCount}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200">
                                <TreePine className="h-5 w-5 text-green-600 mb-2" />
                                <p className="font-bold text-sm">Trees</p>
                                <p className="text-2xl font-black text-green-700">{treesCount}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200">
                                <Users className="h-5 w-5 text-purple-600 mb-2" />
                                <p className="font-bold text-sm">Beneficiaries</p>
                                <p className="text-2xl font-black text-purple-700">{beneficiariesCount}</p>
                            </div>
                        </div>
                    )}

                    {inputMode === 'paste' && (
                        <div className="space-y-3">
                            <Label>Paste JSON Data</Label>
                            <Textarea 
                                placeholder='{"schools": [{"name": "School Name", "patron": "Head Teacher", ...}]}'
                                value={pastedData}
                                onChange={(e) => setPastedData(e.target.value)}
                                className="min-h-[200px] font-mono text-sm"
                            />
                            {parseError && <p className="text-red-500 text-sm">{parseError}</p>}
                            <div className="flex gap-2">
                                <Button onClick={parsePastedData} variant="outline" className="gap-2">
                                    <Copy className="h-4 w-4" /> Parse Data
                                </Button>
                                {selectedFileData && (
                                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                                        <CheckCircle className="h-4 w-4" />
                                        {parsedCount} records parsed
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {inputMode === 'upload' && (
                        <div className="space-y-3">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                accept=".json,.csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Button 
                                variant="outline" 
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Upload JSON or CSV
                            </Button>
                            {selectedFileData && (
                                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    {parsedCount} records loaded from file
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Supported formats: JSON (any structure), CSV (with headers)
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Seeding Configuration</CardTitle>
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
                                {dryRun ? "Preview what would be seeded without making changes" : "Actually seed data into Firestore"}
                            </p>
                        </div>
                    </div>

                    {progress.status === 'idle' && (
                        <Button 
                            onClick={runSeeding} 
                            disabled={!firestore || (inputMode !== 'migration' && !selectedFileData)}
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
                                            result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {result.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                                                <span className="font-bold">{result.collection}</span>
                                            </div>
                                            <span className="text-sm">
                                                {result.success ? `${result.count} seeded` : result.error}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => setProgress(p => ({ ...p, status: 'idle', results: [] }))} variant="outline" className="w-full">
                                <RefreshCw className="h-4 w-4 mr-2" /> Run Again
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
