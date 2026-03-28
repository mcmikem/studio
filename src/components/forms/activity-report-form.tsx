
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormProgress } from '@/components/ui/form-progress';
import { Separator } from '@/components/ui/separator';
import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useFirebaseApp, addDocumentNonBlocking, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { uploadFile, uploadFileWithFallback } from '@/firebase/storage';
import { buildUploadPath } from '@/lib/upload-paths';
import { collection, serverTimestamp, query, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Target, TrendingUp, BarChart3, ArrowRight, Sparkles, MessageCircle, Clock, Wallet, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ImpactMetric, Program, KeyResult, Activity } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { formatCurrency, useNumberInputHandler } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '../ui/badge';

const multipliers = [
  { id: 'combine', label: 'Combining with another activity', value: 15000, icon: Clock },
  { id: 'train', label: 'Training volunteer to lead next time', value: 25000, icon: Zap },
  { id: 'content', label: 'Capturing content for fundraising', value: 50000, icon: Target },
  { id: 'process', label: 'Testing new process for replication', value: 30000, icon: TrendingUp },
];

interface Costs {
  transport: number;
  staffTime: number;
  materials: number;
}

interface ActivityData {
  title: string;
  userId: string;
  userName: string;
  ecosystem_phase: 'Identify & Inspire' | 'Equip & Empower' | 'Activate & Sustain';
  estimatedCost: number;
  actualCost: number;
  directValue: number;
  indirectValue: number;
  totalValue: number;
  estimatedRoi: number;
  finalRoi: number;
  loggedAt: any;
  primaryGoalType: 'Metric' | 'Program';
  primaryGoalId: string;
  primaryGoalQuantity: number;
  keyResultId: string;
  memorableMoment: string;
  challengesLearned: string;
  beneficiaryQuote: string;
  parents_attended?: number;
  teachers_attended?: number;
  trees_planted?: number;
  mediaUrl?: string;
  updatedAt?: any;
}

interface ActivityReportFormProps {
  activity?: Activity;
  onSuccess?: () => void;
}

function ActivityReportFormComponent({ activity: initialActivity, onSuccess }: ActivityReportFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programIdFromUrl = searchParams.get('programId');
  const activityIdFromUrl = searchParams.get('id');

  const { user } = useUser();
  const firestore = useFirestore();

  const { data: fetchedActivity, isLoading: isLoadingActivity } = useDoc<Activity>(
    firestore && activityIdFromUrl ? doc(firestore, 'activities', activityIdFromUrl) : null
  );

  const activity = initialActivity || fetchedActivity;
  const { profile } = useUserProfile(user);
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("planning");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const [activityName, setActivityName] = useState('');
  const [ecosystemPhase, setEcosystemPhase] = useState<'Identify & Inspire' | 'Equip & Empower' | 'Activate & Sustain'>('Identify & Inspire');
  const [costs, setCosts] = useState<Costs>({
    transport: 15000,
    staffTime: 20000,
    materials: 10000,
  });
  const [selectedMultipliers, setSelectedMultipliers] = useState<string[]>([]);
  const [actualCost, setActualCost] = useState(45000);
  
  const [goalType, setGoalType] = useState<'Metric' | 'Program'>('Metric');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalQuantity, setGoalQuantity] = useState(0);
  const [keyResultId, setKeyResultId] = useState<string | null>(null);

  const [parentsAttended, setParentsAttended] = useState(0);
  const [teachersAttended, setTeachersAttended] = useState(0);
  const [treesPlanted, setTreesPlanted] = useState(0);

  const [memorableMoment, setMemorableMoment] = useState('');
  const [challengesLearned, setChallengesLearned] = useState('');
  const [beneficiaryQuote, setBeneficiaryQuote] = useState('');

  const metricsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'impact-metrics'), orderBy('metric')) : null, [firestore]);
  const { data: metrics, isLoading: isLoadingMetrics } = useCollection<ImpactMetric>(metricsQuery);

  const programsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'programs'), orderBy('title')) : null, [firestore]);
  const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);

  const keyResultsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'key-results'), orderBy('title')) : null, [firestore]);
  const { data: keyResults, isLoading: isLoadingKeyResults } = useCollection<KeyResult>(keyResultsQuery);

  const overallLoading = isLoadingMetrics || isLoadingPrograms || isLoadingKeyResults || isLoadingActivity;

  // Initialize form with activity data if editing
  useEffect(() => {
    if (activity) {
      setActivityName(activity.title || '');
      setEcosystemPhase(activity.ecosystem_phase || 'Identify & Inspire');
      setGoalType(activity.primaryGoalType || 'Metric');
      setSelectedGoalId(activity.primaryGoalId || null);
      setGoalQuantity(activity.primaryGoalQuantity || 0);
      setKeyResultId(activity.keyResultId || null);
      setMemorableMoment(activity.memorableMoment || '');
      setChallengesLearned(activity.challengesLearned || '');
      setBeneficiaryQuote(activity.beneficiaryQuote || '');
      setActualCost(activity.actualCost || 0);
      // Note: We don't necessarily have the broken down costs (transport, etc.) in the saved doc
      // but we have the actual cost.
    }
  }, [activity]);

  const selectedMetric = useMemo(() => {
    if (goalType !== 'Metric') return null;
    return metrics?.find(m => m.id === selectedGoalId) || null;
  }, [metrics, selectedGoalId, goalType]);

  const selectedProgram = useMemo(() => {
    if (goalType !== 'Program') return null;
    return programs?.find(p => p.id === selectedGoalId) || null;
  }, [programs, selectedGoalId, goalType]);
  
  useEffect(() => {
    if (programIdFromUrl) {
      setGoalType('Program');
      setSelectedGoalId(programIdFromUrl);
    }
  }, [programIdFromUrl]);

  const preActivityCost = useMemo(
    () => costs.transport + costs.staffTime + costs.materials,
    [costs]
  );
  
  useEffect(() => {
    setActualCost(preActivityCost);
  }, [preActivityCost]);

  const indirectValue = useMemo(() => {
    return multipliers.reduce(
      (total, m) =>
        selectedMultipliers.includes(m.id) ? total + m.value : total,
      0
    );
  }, [selectedMultipliers]);
  
  const directValue = useMemo(() => {
    if (goalType === 'Metric' && selectedMetric?.valuePerUnit) {
      return goalQuantity * selectedMetric.valuePerUnit;
    }
    if (goalType === 'Program' && selectedProgram?.valuePerObjective) {
      return goalQuantity * selectedProgram.valuePerObjective;
    }
    return 0;
  }, [goalType, selectedMetric, selectedProgram, goalQuantity]);

  const totalValue = useMemo(() => directValue + indirectValue, [directValue, indirectValue]);

  const finalRoi = useMemo(() => {
    if (actualCost === 0) return 0;
    return ((totalValue - actualCost) / actualCost) * 100;
  }, [totalValue, actualCost]);

  const handleMultiplierChange = useCallback((id: string, checked: boolean) => {
    setSelectedMultipliers((prev) => checked ? [...prev, id] : prev.filter((mId) => mId !== id));
  }, []);

  const handleLogActivity = async () => {
    if (!activityName.trim() || !user || !firestore || !selectedGoalId || !profile || !keyResultId) {
      toast({ variant: 'destructive', title: 'Mission Incomplete', description: 'Missing required data fields.' });
      return;
    }
    setLoading(true);

    try {
        let finalMediaUrl = '';
        if (mediaFile && firebaseApp) {
            setIsUploading(true);
            const ext = mediaFile.name.split('.').pop() || 'jpg';
            const safeName = `media_${Date.now()}`;
            const uploadResult = await uploadFileWithFallback(firebaseApp, mediaFile, buildUploadPath.activityMedia(user.uid, `${safeName}.${ext}`), user.uid);
            finalMediaUrl = uploadResult?.url || '';
            if (!uploadResult?.success && uploadResult?.error) {
                toast({ variant: 'destructive', title: 'Upload Warning', description: `Media may not have saved. ${uploadResult.error}` });
            }
            setIsUploading(false);
        }

        const activityData: Partial<ActivityData> = {
          title: activityName,
          userId: activity?.userId || user.uid,
          userName: activity?.userName || profile.name,
          ecosystem_phase: ecosystemPhase,
          estimatedCost: preActivityCost,
          actualCost: actualCost,
          directValue: directValue,
          indirectValue: indirectValue,
          totalValue: totalValue,
          estimatedRoi: ((totalValue - preActivityCost) / preActivityCost) * 100,
          finalRoi: finalRoi,
          loggedAt: activity?.loggedAt || serverTimestamp(),
          primaryGoalType: goalType,
          primaryGoalId: selectedGoalId,
          primaryGoalQuantity: goalQuantity,
          keyResultId: keyResultId,
          memorableMoment,
          challengesLearned,
          beneficiaryQuote,
          mediaUrl: finalMediaUrl || activity?.mediaUrl || '',
          updatedAt: serverTimestamp(),
        };

        if (activity?.id) {
            await updateDocumentNonBlocking(doc(firestore, 'activities', activity.id), activityData);
            toast({ title: 'Impact Updated!', description: 'Activity report has been successfully refreshed.' });
        } else {
            await addDocumentNonBlocking(collection(firestore, 'activities'), activityData as ActivityData);
            toast({ title: 'Impact Logged!', description: 'Activity successfully deployed to HQ.' });
        }
        
        if (onSuccess) {
            onSuccess();
        } else {
            router.push('/activity-log');
        }
    } catch(e) {
        console.error(e);
        setIsUploading(false);
        toast({ variant: 'destructive', title: 'Sync Failed', description: 'Failed to upload media or save report.' });
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <Card className="border shadow-comic-sm w-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-omuto-navy/10 p-4 sm:p-6 lg:p-8">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-card border shadow-comic-sm rounded-2xl flex-shrink-0">
                    <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                    <CardTitle className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-none text-omuto-navy truncate">
                        Impact <span className="text-omuto-red">Report</span>
                    </CardTitle>
                    <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-wider mt-2">
                        {activity ? 'Modification Authorized' : 'Impact Verification Terminal'}
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        
        <div className="bg-muted/20 px-4 sm:px-8 pt-4">
            <FormProgress 
                steps={['Strategic Alignment', 'Value & Roi', 'Mission Debrief']} 
                currentStep={currentTab === 'planning' ? 0 : currentTab === 'execution' ? 1 : 2} 
            />
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">

            <CardContent className="p-4 sm:p-6 lg:p-8">
                <TabsContent value="planning" className="mt-0 space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                        <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Mission Title</Label>
                        <Input
                            placeholder="e.g., Tree Planting @ Greenhill"
                            value={activityName}
                            onChange={(e) => setActivityName(e.target.value)}
                            className="h-14 border rounded-2xl text-base font-bold text-omuto-navy"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-3 sm:space-y-4">
                            <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Ecosystem Phase</Label>
                            <Select onValueChange={(value: any) => setEcosystemPhase(value)} value={ecosystemPhase}>
                                <SelectTrigger className="h-14 border rounded-2xl font-bold text-omuto-navy dark:bg-omuto-navy text-omuto-navy dark:text-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Identify & Inspire">Identify & Inspire</SelectItem>
                                    <SelectItem value="Equip & Empower">Equip & Empower</SelectItem>
                                    <SelectItem value="Activate & Sustain">Activate & Sustain</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                            <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Impact Vector</Label>
                            <Select onValueChange={(value: any) => setGoalType(value)} value={goalType}>
                                <SelectTrigger className="h-14 border rounded-2xl font-bold text-omuto-navy dark:bg-omuto-navy text-omuto-navy dark:text-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Metric">KPI Metric</SelectItem>
                                    <SelectItem value="Program">Program Objective</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Goal Selectors - Metric or Program */}
                    {goalType === 'Metric' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Primary Metric</Label>
                                {overallLoading ? <Skeleton className="h-14 rounded-2xl" /> : (
                                    <Select onValueChange={setSelectedGoalId} value={selectedGoalId || undefined}>
                                        <SelectTrigger className="h-14 border rounded-2xl font-bold text-omuto-navy dark:bg-omuto-navy text-omuto-navy dark:text-white"><SelectValue placeholder="Select a metric..." /></SelectTrigger>
                                        <SelectContent>
                                            {metrics?.map(metric => (
                                                <SelectItem key={metric.id} value={metric.id}>{metric.metric}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Quantity ({selectedMetric?.unit || 'units'})</Label>
                                <Input type="number" placeholder="e.g., 50" value={goalQuantity} onChange={e => (e.target.value === '' ? setGoalQuantity(0) : setGoalQuantity(Number(e.target.value)))} disabled={!selectedGoalId} className="h-14 border rounded-2xl font-bold text-omuto-navy" />
                            </div>
                        </div>
                    )}

                    {goalType === 'Program' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Primary Program</Label>
                                {overallLoading ? <Skeleton className="h-12 sm:h-14 rounded-xl" /> : (
                                    <Select onValueChange={setSelectedGoalId} value={selectedGoalId || undefined} disabled={!!programIdFromUrl}>
                                        <SelectTrigger className="h-12 sm:h-14 border rounded-xl font-semibold text-omuto-navy"><SelectValue placeholder="Select a program..." /></SelectTrigger>
                                        <SelectContent>
                                            {programs?.map(program => (
                                                <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Objectives Completed</Label>
                                    <Input type="number" placeholder="e.g., 1" value={goalQuantity} onChange={e => (e.target.value === '' ? setGoalQuantity(0) : setGoalQuantity(Number(e.target.value)))} disabled={!selectedGoalId} className="h-12 sm:h-14 border rounded-xl font-semibold text-omuto-navy" />
                                </div>
                            </div>
                        )}

                        {/* Conditional Program-Specific Fields (RED Campaign, GreenSchools) */}
                        {selectedProgram?.title === 'RED Campaign' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6 mt-4 bg-omuto-red/10 border border-omuto-red/20 rounded-xl sm:rounded-2xl">
                                <div className="space-y-2">
                                    <Input type="number" placeholder="e.g., 25" value={parentsAttended} onChange={e => (e.target.value === '' ? setParentsAttended(0) : setParentsAttended(Number(e.target.value)))} className="h-12 sm:h-14 border rounded-xl font-semibold text-omuto-navy" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1 text-primary">Teachers Attended</Label>
                                    <Input type="number" placeholder="e.g., 5" value={teachersAttended} onChange={e => (e.target.value === '' ? setTeachersAttended(0) : setTeachersAttended(Number(e.target.value)))} className="h-12 sm:h-14 border rounded-xl font-semibold text-omuto-navy" />
                                </div>
                            </div>
                        )}
                        
                        {selectedProgram?.title === 'GreenSchools Campaign' && (
                            <div className="p-4 sm:p-6 mt-4 bg-omuto-teal/10 border border-omuto-teal/20 rounded-xl sm:rounded-2xl">
                                <div className="space-y-2">
                                    <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1 text-primary">Trees Planted</Label>
                                    <Input type="number" placeholder="e.g., 150" value={treesPlanted} onChange={e => (e.target.value === '' ? setTreesPlanted(0) : setTreesPlanted(Number(e.target.value)))} className="h-12 sm:h-14 border rounded-xl font-semibold text-omuto-navy" />
                                </div>
                            </div>
                        )}

                        <div className="p-6 sm:p-8 bg-omuto-navy text-white rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 dark:bg-omuto-navy text-omuto-navy dark:text-white/10 rounded-xl"><Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /></div>
                                <div>
                                    <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-wider">Potential Value</p>
                                    <p className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">{formatCurrency(directValue)}</p>
                                </div>
                            </div>
                            <Button type="button" onClick={() => setCurrentTab("execution")} className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl w-full sm:w-auto transition-all">
                                NEXT <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="execution" className="mt-0 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="p-4 sm:p-6 bg-muted/20 border-lg border-transparent rounded-2xl space-y-2">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider">Transport</Label>
                                <Input type="number" value={costs.transport} onChange={(e) => setCosts(prev => ({...prev, transport: Number(e.target.value)}))} className="h-12 border-lg rounded-xl font-bold text-omuto-navy dark:bg-omuto-navy text-omuto-navy dark:text-white" />
                            </div>
                             <div className="p-4 sm:p-6 bg-muted/20 border-lg border-transparent rounded-2xl space-y-2">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider">Staff Time</Label>
                                <Input type="number" value={costs.staffTime} onChange={(e) => setCosts(prev => ({...prev, staffTime: Number(e.target.value)}))} className="h-12 border-lg rounded-xl font-bold text-omuto-navy dark:bg-omuto-navy text-omuto-navy dark:text-white" />
                            </div>
                             <div className="p-4 sm:p-6 bg-muted/20 border-lg border-transparent rounded-2xl space-y-2">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider">Materials</Label>
                                <Input type="number" value={costs.materials} onChange={(e) => setCosts(prev => ({...prev, materials: Number(e.target.value)}))} className="h-12 border-lg rounded-xl font-bold text-omuto-navy dark:bg-omuto-navy text-omuto-navy dark:text-white" />
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 bg-omuto-navy rounded-2xl shadow-comic flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 dark:bg-omuto-navy text-omuto-navy dark:text-white/10 rounded-2xl"><Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-omuto-yellow" /></div>
                                <div>
                                    <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-wider">Estimated Cost</p>
                                    <p className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">{formatCurrency(preActivityCost)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            <h3 className="font-heading font-bold uppercase tracking-tight text-base sm:text-lg text-omuto-navy">Value Multipliers</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {multipliers.map((m) => (
                                    <div key={m.id} className={`p-4 sm:p-6 border-lg rounded-2xl transition-all cursor-pointer flex items-center gap-4 group ${selectedMultipliers.includes(m.id) ? 'border-omuto-red dark:bg-omuto-navy text-omuto-navy dark:text-white shadow-comic-sm' : 'border-omuto-navy/5 bg-muted/30 hover:border-omuto-navy/20'}`} onClick={() => handleMultiplierChange(m.id, !selectedMultipliers.includes(m.id))}>
                                        <div className={`p-3 rounded-2xl border-lg ${selectedMultipliers.includes(m.id) ? 'bg-omuto-red text-white border-omuto-red' : 'dark:bg-omuto-navy text-omuto-navy dark:text-white text-muted-foreground border-omuto-navy/5'} group-hover:scale-105 transition-transform`}><m.icon className="h-5 w-5" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-xs leading-tight uppercase truncate ${selectedMultipliers.includes(m.id) ? 'text-omuto-navy' : 'text-omuto-navy/60'}`}>{m.label}</p>
                                            <p className={`text-[10px] font-bold mt-1 ${selectedMultipliers.includes(m.id) ? 'text-omuto-red' : 'text-muted-foreground'}`}>+{formatCurrency(m.value)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 bg-omuto-navy rounded-2xl shadow-comic flex flex-col sm:flex-row items-center justify-between gap-4">
                             <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 dark:bg-omuto-navy text-omuto-navy dark:text-white/10 rounded-2xl"><Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-omuto-yellow" /></div>
                                <div>
                                    <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-wider">Total Impact</p>
                                    <p className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">{formatCurrency(totalValue)}</p>
                                </div>
                            </div>
                            <Button type="button" onClick={() => setCurrentTab("logging")} className="btn-omuto h-14 px-8 bg-omuto-red text-white border-white shadow-comic-sm w-full sm:w-auto">
                                NEXT <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="logging" className="mt-0 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="p-6 sm:p-8 bg-primary/10 border border-primary/20 rounded-xl">
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary">Final Return</p>
                                <p className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-omuto-navy">+{finalRoi.toFixed(0)}%</p>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Strategic Alignment</Label>
                                <Select onValueChange={setKeyResultId} value={keyResultId || undefined}>
                                    <SelectTrigger className="h-14 border rounded-2xl font-bold text-omuto-navy dark:bg-omuto-navy text-omuto-navy dark:text-white"><SelectValue placeholder="Link to Key Result..." /></SelectTrigger>
                                    <SelectContent>
                                        {keyResults?.map(kr => (
                                            <SelectItem key={kr.id} value={kr.id}>{kr.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            <h3 className="font-heading font-bold uppercase tracking-tight text-base sm:text-lg text-omuto-navy">Mission Debrief & Story</h3>
                            <div className="space-y-3 sm:space-y-4">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1 flex items-center gap-2"><MessageCircle className="h-3 w-3 text-muted-foreground" /> Memorable Moment</Label>
                                <Textarea value={memorableMoment} onChange={e => setMemorableMoment(e.target.value)} className="min-h-[100px] border-lg rounded-2xl p-6 text-sm text-omuto-navy font-bold dark:bg-omuto-navy text-omuto-navy dark:text-white" placeholder="Describe a specific moment..." />
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1 flex items-center gap-2"><Sparkles className="h-3 w-3 text-muted-foreground" /> Beneficiary Quote</Label>
                                <Textarea value={beneficiaryQuote} onChange={e => setBeneficiaryQuote(e.target.value)} className="min-h-[100px] border-lg rounded-2xl p-6 text-sm text-omuto-navy font-bold dark:bg-omuto-navy text-omuto-navy dark:text-white" placeholder='e.g., "I never knew..."' />
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1 flex items-center gap-2"><Clock className="h-3 w-3 text-muted-foreground" /> Challenges & Learnings</Label>
                                <Textarea value={challengesLearned} onChange={e => setChallengesLearned(e.target.value)} className="min-h-[100px] border-lg rounded-2xl p-6 text-sm text-omuto-navy font-bold dark:bg-omuto-navy text-omuto-navy dark:text-white" placeholder="What challenges did you face?" />
                            </div>
                            <div className="space-y-3 pt-4">
                                <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">Attach Media</Label>
                                <div className="flex items-center gap-4">
                                    <Input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/webp, video/mp4, video/quicktime" 
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 5 * 1024 * 1024 && file.type.startsWith('image/')) {
                                                    toast({ variant: 'destructive', title: 'File too large', description: `${(file.size / 1024 / 1024).toFixed(1)}MB — please use an image under 5MB.` });
                                                    return;
                                                }
                                                setMediaFile(file);
                                                if (file.type.startsWith('image/')) {
                                                    setMediaPreview(URL.createObjectURL(file));
                                                } else {
                                                    setMediaPreview('');
                                                }
                                            }
                                        }}
                                        className="hidden" 
                                        id="media-upload" 
                                    />
                                    <Label 
                                        htmlFor="media-upload" 
                                        className="h-14 flex items-center justify-center gap-2 border border-omuto-navy border-dashed rounded-2xl bg-muted/20 px-6 cursor-pointer hover:bg-muted/40 transition-colors w-full font-bold text-omuto-navy text-sm"
                                    >
                                        <Upload className="h-5 w-5" />
                                        {mediaFile ? mediaFile.name : 'Upload Event Photo or Video'}
                                    </Label>
                                </div>
                                {mediaPreview && (
                                    <div className="mt-2 p-2 border border-omuto-navy/10 rounded-2xl bg-muted/20 inline-block">
                                        <img src={mediaPreview} alt="Media preview" className="max-h-32 rounded-xl object-contain" />
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-2 text-center">Preview</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button type="button" className="btn-omuto h-16 w-full bg-omuto-red text-white border-white shadow-comic-sm" onClick={handleLogActivity} disabled={loading || isUploading}>
                            {(loading || isUploading) ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                            {isUploading ? 'UPLOADING...' : activity ? 'UPDATE MISSION IMPACT' : 'SUBMIT ACTIVITY REPORT'}
                        </Button>
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    );
}

export function ActivityReportForm(props: ActivityReportFormProps) {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl sm:rounded-2xl" />}>
            <ActivityReportFormComponent {...props} />
        </Suspense>
    )
}
