'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    Upload,
    FileJson,
    FileSpreadsheet,
    ArrowRight,
    ArrowLeft,
    Trash2,
    Eye,
    Edit,
    Check
} from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
    const { profile } = useUserProfile(user);
    const { viewAsRole } = useViewAs();
    const effectiveRole = viewAsRole || profile?.role;
    
    const [step, setStep] = useState<Step>('upload');
    const [rawData, setRawData] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
    const [dryRun, setDryRun] = useState(true);
    const [results, setResults] = useState<SeedResult[]>([]);
    const [parseError, setParseError] = useState('');
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

    const selectedCollectionInfo = COLLECTIONS.find(c => c.id === selectedCollection);
    const detectedColumns = useMemo(() => {
        if (rawData.length === 0) return [];
        const firstRow = rawData[0];
        return Object.keys(firstRow).filter(k => k !== 'id');
    }, [rawData]);

    // Auto-map columns based on common patterns
    const autoMapColumns = () => {
        if (!selectedCollectionInfo) return;
        
        const mappings: ColumnMapping[] = [];
        const targetFields = selectedCollectionInfo.fields;
        
        detectedColumns.forEach(col => {
            const colLower = col.toLowerCase().replace(/[_\s]/g, '');
            
            // Try to find matching target field
            for (const field of targetFields) {
                const fieldLower = field.toLowerCase().replace(/[_\s]/g, '');
                if (colLower === fieldLower || 
                    colLower.includes(fieldLower) || 
                    fieldLower.includes(colLower)) {
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
                const arr = Array.isArray(parsed) ? parsed : parsed.data || parsed.records || [parsed];
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
            reader.onload = (e) => parseFile(e.target?.result as string || '', file.name);
            reader.readAsText(file);
        }
    };

    const clearCollection = async (collectionName: string) => {
        if (!firestore || dryRun) return;
        const snap = await getDocs(collection(firestore, collectionName));
        await Promise.all(snap.docs.map(d => deleteDoc(doc(firestore, collectionName, d.id))));
    };

    const runSeeding = async () => {
        if (!selectedCollection || rawData.length === 0) return;
        
        setStep('seeding');
        setResults([]);

        if (!dryRun) await clearCollection(selectedCollection);

        let count = 0;
        for (const row of rawData) {
            try {
                const docData: any = { createdAt: new Date(), createdBy: 'seeding-bot' };
                
                columnMappings.forEach(mapping => {
                    let value = row[mapping.source];
                    // Convert numeric fields
                    if (['amount', 'enrollment', 'beneficiaries', 'totalTreesAtPlanting', 'numberOfTreesSurvived', 'age', 'duration', 'finalRoi'].includes(mapping.target)) {
                        value = parseFloat(value) || 0;
                    }
                    docData[mapping.target] = value;
                });

                // Add any unmapped fields that have values
                detectedColumns.forEach(col => {
                    const isMapped = columnMappings.some(m => m.source === col);
                    if (!isMapped && row[col] !== undefined && row[col] !== '') {
                        docData[col] = row[col];
                    }
                });

                if (!dryRun) {
                    await addDoc(collection(firestore!, selectedCollection), docData);
                }
                count++;
            } catch (e) {
                console.error('Error seeding row:', e);
            }
        }

        setResults([{ collection: selectedCollection, success: true, count }]);
        setStep('complete');
    };

    const reset = () => {
        setStep('upload');
        setRawData([]);
        setSelectedCollection('');
        setColumnMappings([]);
        setResults([]);
    };

    return (
        <div className="max-w-full overflow-hidden">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Data Seeding Bot
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Upload data and map columns to seed into Firestore</p>
                </div>

                {/* Progress Steps */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    {['upload', 'map', 'preview', 'seeding', 'complete'].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`px-3 py-1 rounded-full font-medium ${
                                step === s ? 'bg-primary text-white' :
                                ['seeding', 'complete'].includes(step) && i <= 4 ? 'bg-green-100 text-green-700' :
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
                            <CardTitle>1. Upload Data</CardTitle>
                            <CardDescription>Drag & drop or select a file to upload</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">{rawData.length} records loaded</span>
                                    <span className="text-sm text-muted-foreground">({detectedColumns.length} columns)</span>
                                </div>
                            )}
                            
                            {parseError && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-600 text-sm">{parseError}</div>
                            )}

                            {rawData.length > 0 && (
                                <Button onClick={() => setStep('map')} className="w-full gap-2">
                                    Continue <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Map Columns */}
                {step === 'map' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Map Columns</CardTitle>
                            <CardDescription>Select which collection to seed and map columns</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Column Mappings</Label>
                                        <Button variant="outline" size="sm" onClick={autoMapColumns} className="gap-1">
                                            <RefreshCw className="h-3 w-3" /> Auto-Map
                                        </Button>
                                    </div>
                                    <div className="grid gap-2">
                                        {detectedColumns.map(col => {
                                            const mapping = columnMappings.find(m => m.source === col);
                                            return (
                                                <div key={col} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                                    <span className="flex-1 font-mono text-sm truncate">{col}</span>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                    <Select 
                                                        value={mapping?.target || ''} 
                                                        onValueChange={(val) => {
                                                            if (val) {
                                                                setColumnMappings([...columnMappings.filter(m => m.source !== col), { source: col, target: val }]);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="flex-1"><SelectValue placeholder="Skip (leave blank)" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__skip__">-- Skip --</SelectItem>
                                                            {selectedCollectionInfo?.fields.map(f => (
                                                                <SelectItem key={f} value={f}>{f}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedCollection && (
                                <Button onClick={() => setStep('preview')} className="w-full gap-2">
                                    Continue <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}
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
                            <CardTitle>3. Preview & Configure</CardTitle>
                            <CardDescription>Review what will be seeded</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 rounded-lg bg-muted/30">
                                    <p className="text-muted-foreground">Records to seed</p>
                                    <p className="text-2xl font-bold">{rawData.length}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/30">
                                    <p className="text-muted-foreground">Target Collection</p>
                                    <p className="text-2xl font-bold">{selectedCollectionInfo?.label}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/30">
                                    <p className="text-muted-foreground">Fields Mapped</p>
                                    <p className="text-2xl font-bold">{columnMappings.length}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/30">
                                    <p className="text-muted-foreground">Extra Fields</p>
                                    <p className="text-2xl font-bold">{detectedColumns.length - columnMappings.length}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50">
                                <input type="checkbox" id="dryRun" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-5 w-5" />
                                <div>
                                    <Label htmlFor="dryRun" className="font-bold cursor-pointer">Dry Run Mode</Label>
                                    <p className="text-sm text-muted-foreground">{dryRun ? "Preview without saving" : "Actually save to Firestore"}</p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/30 p-2 font-bold text-xs uppercase">Preview (first 3 records)</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                {columnMappings.map(m => (
                                                    <th key={m.source} className="p-2 text-left font-medium">{m.target}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rawData.slice(0, 3).map((row, i) => (
                                                <tr key={i} className="border-b">
                                                    {columnMappings.map(m => (
                                                        <td key={m.source} className="p-2 truncate max-w-[150px]">{row[m.source] || '-'}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <Button onClick={runSeeding} disabled={!firestore} className="w-full py-6 text-lg font-bold gap-2">
                                <Play className="h-5 w-5" />
                                {dryRun ? 'Preview Seeding' : 'Start Seeding'}
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
                            <p className="text-xl font-bold">Seeding data...</p>
                            <p className="text-muted-foreground mt-2">Processing {rawData.length} records</p>
                        </CardContent>
                    </Card>
                )}

                {/* Step 5: Complete */}
                {step === 'complete' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-6 w-6" />
                                Seeding Complete!
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {results.map((result, i) => (
                                <div key={i} className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
                                    <p className="font-bold">{result.collection}</p>
                                    <p className="text-2xl font-black text-green-700">{result.count} records {dryRun ? 'would be' : ''} seeded</p>
                                </div>
                            ))}
                            
                            {!dryRun && (
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
                                    <p className="font-bold text-amber-800">Data has been saved to Firestore!</p>
                                    <p className="text-sm text-amber-700 mt-1">You can now view it in the Data Manager.</p>
                                </div>
                            )}

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
