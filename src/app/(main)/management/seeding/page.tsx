'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore } from '@/firebase';
import { 
    Database, 
    Play,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    Upload,
    ArrowRight,
    ArrowLeft,
    Building2,
    Users,
    TreePine,
    Droplets
} from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { MIGRATION_DATA } from '@/lib/data/migration-data';
import { getSubcountyCoordinates } from '@/lib/uganda-data';

interface ColumnMapping {
    source: string;
    target: string;
}

interface SeedResult {
    collection: string;
    success: boolean;
    count: number;
    error?: string;
}

type Step = 'upload' | 'map' | 'preview' | 'seeding' | 'complete';

const COLLECTIONS = [
    { id: 'schools', label: 'Schools', fields: ['schoolName', 'patron', 'subCounty', 'district', 'status', 'tier', 'programs', 'enrollment', 'latitude', 'longitude'] },
    { id: 'users', label: 'Users', fields: ['name', 'email', 'role', 'phone', 'status', 'department'] },
    { id: 'water-sources', label: 'Water Sources', fields: ['name', 'location', 'subCounty', 'district', 'type', 'status', 'beneficiaries', 'latitude', 'longitude'] },
    { id: 'tree-surveys', label: 'Tree Surveys', fields: ['schoolName', 'subCounty', 'district', 'totalTreesAtPlanting', 'numberOfTreesSurvived', 'surveyDate', 'category'] },
    { id: 'beneficiaries', label: 'Beneficiaries', fields: ['name', 'gender', 'age', 'school', 'program', 'subCounty', 'district', 'status'] },
    { id: 'expenses', label: 'Expenses', fields: ['title', 'type', 'amount', 'status', 'date', 'userId', 'description'] },
    { id: 'income', label: 'Income', fields: ['title', 'amount', 'source', 'dateReceived', 'status'] },
    { id: 'activities', label: 'Activities', fields: ['title', 'userId', 'schoolId', 'loggedAt', 'duration', 'finalRoi'] },
];

export default function SeedingBotPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    
    // ALL hooks declared BEFORE any conditional returns
    const [step, setStep] = useState<Step>('upload');
    const [rawData, setRawData] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
    const [dryRun, setDryRun] = useState(true);
    const [results, setResults] = useState<SeedResult[]>([]);
    const [parseError, setParseError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const selectedCollectionInfo = COLLECTIONS.find(c => c.id === selectedCollection);
    
    const detectedColumns = useMemo(() => {
        if (rawData.length === 0) return [];
        return Object.keys(rawData[0]).filter(k => k !== 'id');
    }, [rawData]);

    // Migration data counts
    const schoolsCount = MIGRATION_DATA.schools?.length || 0;
    const treesCount = MIGRATION_DATA.trees?.length || 0;
    const waterCount = MIGRATION_DATA.water?.length || 0;
    const beneficiariesCount = MIGRATION_DATA.beneficiaries?.length || 0;

    const autoMapColumns = () => {
        if (!selectedCollectionInfo) return;
        
        const mappings: ColumnMapping[] = [];
        detectedColumns.forEach(col => {
            const colLower = col.toLowerCase().replace(/[_\s]/g, '');
            for (const field of selectedCollectionInfo.fields) {
                const fieldLower = field.toLowerCase().replace(/[_\s]/g, '');
                if (colLower === fieldLower || colLower.includes(fieldLower) || fieldLower.includes(colLower)) {
                    mappings.push({ source: col, target: field });
                    break;
                }
            }
        });
        setColumnMappings(mappings);
    };

    const parseFile = (content: string, filename: string) => {
        try {
            if (filename.endsWith('.json')) {
                const parsed = JSON.parse(content);
                const arr = Array.isArray(parsed) ? parsed : parsed.data || [parsed];
                setRawData(arr);
                setParseError('');
            } else if (filename.endsWith('.csv')) {
                const lines = content.trim().split('\n');
                const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));
                const data = lines.slice(1).map(line => {
                    const values = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
                    const obj: any = {};
                    headers.forEach((h, i) => { obj[h] = values[i]; });
                    return obj;
                });
                setRawData(data);
                setParseError('');
            }
        } catch (e) {
            setParseError('Failed to parse file: ' + (e as Error).message);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => parseFile(e.target?.result as string || '', file.name);
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => parseFile(ev.target?.result as string || '', file.name);
            reader.readAsText(file);
        }
    };

    const seedFromMigration = async () => {
        if (!selectedCollection || !firestore) return;
        
        setLoading(true);
        let count = 0;

        try {
            // Clear existing
            if (!dryRun) {
                const snap = await getDocs(collection(firestore, selectedCollection));
                await Promise.all(snap.docs.map(d => deleteDoc(doc(firestore, selectedCollection, d.id))));
            }

            // Seed based on collection type
            const colRef = collection(firestore, selectedCollection);
            
            if (selectedCollection === 'schools' && MIGRATION_DATA.schools) {
                for (const s of MIGRATION_DATA.schools) {
                    const subcounty = s.sc || '';
                    const coords = getSubcountyCoordinates(subcounty, 'Mpigi');
                    const docData = {
                        schoolName: s.name,
                        patron: s.patron || 'Head Teacher',
                        subCounty: subcounty,
                        district: 'Mpigi',
                        status: 'Active',
                        programs: s.progs || [],
                        coordinates: coords,
                        latitude: coords?.lat || 0,
                        longitude: coords?.lng || 0,
                        createdAt: new Date(),
                        createdBy: 'seeding-bot'
                    };
                    if (!dryRun) await addDoc(colRef, docData);
                    count++;
                }
            } else if (selectedCollection === 'tree-surveys' && MIGRATION_DATA.trees) {
                for (const t of MIGRATION_DATA.trees) {
                    const subcounty = t.subcounty || '';
                    const coords = getSubcountyCoordinates(subcounty, 'Mpigi');
                    const docData = {
                        schoolName: t.school || '',
                        subCounty: subcounty,
                        district: 'Mpigi',
                        totalTreesAtPlanting: parseInt(t.qty) || 0,
                        surveyDate: t.date || '',
                        category: t.category || 'Tree Planting',
                        coordinates: coords,
                        createdAt: new Date(),
                        createdBy: 'seeding-bot'
                    };
                    if (!dryRun) await addDoc(colRef, docData);
                    count++;
                }
            } else if (selectedCollection === 'water-sources' && MIGRATION_DATA.water) {
                for (const w of MIGRATION_DATA.water) {
                    const coords = getSubcountyCoordinates('', 'Mpigi');
                    const docData = {
                        name: w.name || '',
                        status: w.status || 'working',
                        location: w.village || '',
                        district: 'Mpigi',
                        coordinates: coords,
                        createdAt: new Date(),
                        createdBy: 'seeding-bot'
                    };
                    if (!dryRun) await addDoc(colRef, docData);
                    count++;
                }
            } else if (selectedCollection === 'beneficiaries' && MIGRATION_DATA.beneficiaries) {
                for (const b of MIGRATION_DATA.beneficiaries) {
                    const docData = {
                        name: b.name || '',
                        school: b.school || '',
                        program: b.prog || '',
                        gender: b.gender || '',
                        subCounty: b.subcounty || '',
                        district: 'Mpigi',
                        createdAt: new Date(),
                        createdBy: 'seeding-bot'
                    };
                    if (!dryRun) await addDoc(colRef, docData);
                    count++;
                }
            } else {
                // Use uploaded data
                for (const row of rawData) {
                    const docData: any = { createdAt: new Date(), createdBy: 'seeding-bot' };
                    columnMappings.forEach(mapping => {
                        let value = row[mapping.source];
                        if (['amount', 'enrollment', 'totalTreesAtPlanting', 'numberOfTreesSurvived'].includes(mapping.target)) {
                            value = parseFloat(value) || 0;
                        }
                        docData[mapping.target] = value;
                    });
                    if (!dryRun) await addDoc(colRef, docData);
                    count++;
                }
            }

            setResults([{ collection: selectedCollection, success: true, count }]);
        } catch (e: any) {
            setResults([{ collection: selectedCollection, success: false, count: 0, error: e.message }]);
        }
        
        setLoading(false);
        setStep('complete');
    };

    const reset = () => {
        setStep('upload');
        setRawData([]);
        setSelectedCollection('');
        setColumnMappings([]);
        setResults([]);
    };

    const hasMigrationData = selectedCollection === 'schools' || selectedCollection === 'tree-surveys' || 
        selectedCollection === 'water-sources' || selectedCollection === 'beneficiaries';

    return (
        <div className="max-w-full overflow-hidden">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Seeding Bot
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Import data from files or built-in migration data</p>
                </div>

                {/* Progress Steps */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    {['upload', 'map', 'preview', 'seeding', 'complete'].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`px-3 py-1 rounded-full font-medium ${
                                step === s ? 'bg-primary text-white' :
                                'bg-muted text-muted-foreground'
                            }`}>
                                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
                            </div>
                            {i < 4 && <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground" />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Data</CardTitle>
                            <CardDescription>Drag & drop a file or use built-in migration data</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Migration Data Option */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <button
                                    onClick={() => { setSelectedCollection('schools'); setStep('map'); }}
                                    className="p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-center"
                                >
                                    <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                                    <p className="font-bold text-sm">Schools</p>
                                    <p className="text-2xl font-black text-blue-600">{schoolsCount}</p>
                                </button>
                                <button
                                    onClick={() => { setSelectedCollection('tree-surveys'); setStep('map'); }}
                                    className="p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-center"
                                >
                                    <TreePine className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                    <p className="font-bold text-sm">Trees</p>
                                    <p className="text-2xl font-black text-green-600">{treesCount}</p>
                                </button>
                                <button
                                    onClick={() => { setSelectedCollection('water-sources'); setStep('map'); }}
                                    className="p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-center"
                                >
                                    <Droplets className="h-8 w-8 mx-auto mb-2 text-cyan-500" />
                                    <p className="font-bold text-sm">Water</p>
                                    <p className="text-2xl font-black text-cyan-600">{waterCount}</p>
                                </button>
                                <button
                                    onClick={() => { setSelectedCollection('beneficiaries'); setStep('map'); }}
                                    className="p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-center"
                                >
                                    <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                                    <p className="font-bold text-sm">Beneficiaries</p>
                                    <p className="text-2xl font-black text-purple-600">{beneficiariesCount}</p>
                                </button>
                            </div>

                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t"></div></div>
                                <span className="relative bg-background px-4 text-sm text-muted-foreground">or upload a file</span>
                            </div>

                            <div 
                                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="font-bold">Click to upload or drag & drop</p>
                                <p className="text-sm text-muted-foreground mt-1">Supports .json and .csv files</p>
                            </div>
                            <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
                            
                            {rawData.length > 0 && (
                                <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">{rawData.length} records loaded</span>
                                </div>
                            )}
                            
                            {parseError && (
                                <div className="bg-red-50 p-3 rounded-lg text-red-600 text-sm">{parseError}</div>
                            )}

                            {rawData.length > 0 && (
                                <Button onClick={() => setStep('map')} className="w-full gap-2">
                                    Continue <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Map (or Skip for Migration Data) */}
                {step === 'map' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {hasMigrationData ? 'Confirm Seed' : 'Map Columns'}
                            </CardTitle>
                            <CardDescription>
                                {hasMigrationData 
                                    ? `Ready to seed ${selectedCollectionInfo?.label} from built-in data`
                                    : 'Select collection and map columns'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!hasMigrationData && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Target Collection</Label>
                                        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                                            <SelectTrigger><SelectValue placeholder="Select collection..." /></SelectTrigger>
                                            <SelectContent>
                                                {COLLECTIONS.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {selectedCollection && (
                                        <Button variant="outline" onClick={autoMapColumns} className="w-full gap-2">
                                            <RefreshCw className="h-3 w-3" /> Auto-Map Columns
                                        </Button>
                                    )}
                                    {selectedCollection && detectedColumns.map(col => (
                                        <div key={col} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                            <span className="flex-1 font-mono text-sm">{col}</span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <Select 
                                                value={columnMappings.find(m => m.source === col)?.target || ''} 
                                                onValueChange={(val) => {
                                                    setColumnMappings([...columnMappings.filter(m => m.source !== col), { source: col, target: val }]);
                                                }}
                                            >
                                                <SelectTrigger className="flex-1"><SelectValue placeholder="Skip" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__skip__">-- Skip --</SelectItem>
                                                    {selectedCollectionInfo?.fields.map(f => (
                                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </>
                            )}
                            <Button onClick={() => setStep('preview')} className="w-full gap-2">
                                Continue <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" onClick={() => setStep('upload')} className="w-full gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Preview */}
                {step === 'preview' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-muted/30">
                                    <p className="text-sm text-muted-foreground">Records to seed</p>
                                    <p className="text-2xl font-bold">{rawData.length || (hasMigrationData ? 'From built-in data' : 0)}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/30">
                                    <p className="text-sm text-muted-foreground">Collection</p>
                                    <p className="text-2xl font-bold">{selectedCollectionInfo?.label}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
                                <input type="checkbox" id="dryRun" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-5 w-5" />
                                <div>
                                    <Label htmlFor="dryRun" className="font-bold cursor-pointer">Dry Run Mode</Label>
                                    <p className="text-sm text-muted-foreground">{dryRun ? "Preview without saving" : "Save to Firestore"}</p>
                                </div>
                            </div>

                            <Button onClick={seedFromMigration} disabled={!firestore || loading} className="w-full py-6 text-lg font-bold gap-2">
                                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                                {dryRun ? 'Preview' : 'Start Seeding'}
                            </Button>
                            <Button variant="outline" onClick={() => setStep('map')} className="w-full gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Seeding */}
                {step === 'seeding' && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <RefreshCw className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
                            <p className="text-xl font-bold">Seeding...</p>
                        </CardContent>
                    </Card>
                )}

                {/* Step 5: Complete */}
                {step === 'complete' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-6 w-6" />
                                Complete!
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {results.map((r, i) => (
                                <div key={i} className="p-4 rounded-lg bg-green-50 border border-green-200">
                                    <p className="font-bold">{r.collection}</p>
                                    <p className="text-2xl font-black text-green-700">{r.count} records {dryRun ? 'would be' : ''} seeded</p>
                                </div>
                            ))}
                            <Button onClick={reset} className="w-full gap-2">
                                <RefreshCw className="h-4 w-4" /> Seed More Data
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
