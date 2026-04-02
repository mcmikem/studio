'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, Users, Droplets, TreePine, Check } from 'lucide-react';
import { OfflineStatus } from '@/components/ui/offline-status';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { useAutoSave, loadDraft, clearDraft } from '@/hooks/use-auto-save';
import { GPSLocationPicker } from '@/components/ui/gps-location-picker';
import type { SchoolXperience } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const beneficiarySchema = z.object({
  schoolId: z.string().min(1, 'School is required'),
  schoolName: z.string().min(1, 'School name is required'),
  date: z.string().min(1, 'Date is required'),
  recordedBy: z.string().min(2, 'Your name is required'),
  beneficiaryType: z.enum(['student', 'teacher', 'parent', 'community_member']),
  gender: z.enum(['male', 'female', 'other']),
  ageGroup: z.enum(['under_10', '10_14', '15_19', '20_24', '25_plus']),
  programme: z.enum(['RED', 'PureWater', 'GreenSchools', 'SLF']),
  servicesProvided: z.array(z.string()).min(1, 'Select at least one service'),
  notes: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const waterSourceSchema = z.object({
  schoolId: z.string().min(1, 'School is required'),
  schoolName: z.string().min(1, 'School name is required'),
  date: z.string().min(1, 'Date is required'),
  recordedBy: z.string().min(2, 'Your name is required'),
  sourceType: z.enum(['borehole', 'rainwater_harvest', 'protected_well', 'spring', 'pipeline', 'other']),
  status: z.enum(['functional', 'needs_repair', 'non_functional']),
  waterQuality: z.enum(['safe', 'needs_treatment', 'unsafe']),
  estimatedBeneficiaries: z.coerce.number().min(1),
  notes: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const treeSchema = z.object({
  schoolId: z.string().min(1, 'School is required'),
  schoolName: z.string().min(1, 'School name is required'),
  date: z.string().min(1, 'Date is required'),
  recordedBy: z.string().min(2, 'Your name is required'),
  treeType: z.enum(['fruit', 'timber', 'shade', 'medicinal', 'native', 'mixed']),
  quantity: z.coerce.number().min(1),
  plantingArea: z.string().optional(),
  survivalCount: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;
type WaterSourceFormData = z.infer<typeof waterSourceSchema>;
type TreeFormData = z.infer<typeof treeSchema>;

const BENEFIT_SERVICES = [
  'Menstrual hygiene management',
  'Sanitation education',
  'Clean water access',
  'Handwashing training',
  'Leadership skills',
  'Environmental education',
  'Tree planting awareness',
];

function LogImpactFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { submit } = useFormSubmission();
  const [activeTab, setActiveTab] = useState<'beneficiary' | 'water' | 'tree'>('beneficiary');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore]);

  const { data: schools } = useCollection<SchoolXperience>(schoolsQuery);

  const preselectedSchoolId = searchParams.get('schoolId') || '';
  const preselectedSchoolName = searchParams.get('schoolName') || '';

  const beneficiaryForm = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      schoolId: preselectedSchoolId,
      schoolName: preselectedSchoolName,
      date: new Date().toISOString().split('T')[0],
      beneficiaryType: 'student',
      gender: 'female',
      ageGroup: '15_19',
      programme: 'RED',
      servicesProvided: [],
    },
  });

  const waterForm = useForm<WaterSourceFormData>({
    resolver: zodResolver(waterSourceSchema),
    defaultValues: {
      schoolId: preselectedSchoolId,
      schoolName: preselectedSchoolName,
      date: new Date().toISOString().split('T')[0],
      sourceType: 'borehole',
      status: 'functional',
      waterQuality: 'safe',
      estimatedBeneficiaries: 50,
    },
  });

  const treeForm = useForm<TreeFormData>({
    resolver: zodResolver(treeSchema),
    defaultValues: {
      schoolId: preselectedSchoolId,
      schoolName: preselectedSchoolName,
      date: new Date().toISOString().split('T')[0],
      treeType: 'native',
      quantity: 10,
    },
  });

  const selectedSchoolId = beneficiaryForm.watch('schoolId');
  const selectedSchool = schools?.find((s) => s.id === selectedSchoolId);

  useEffect(() => {
    if (!preselectedSchoolId) {
      const savedBen = loadDraft<BeneficiaryFormData>('impact-beneficiary');
      if (savedBen) {
        Object.entries(savedBen).forEach(([key, value]) => {
          beneficiaryForm.setValue(key as keyof BeneficiaryFormData, value as any)
        })
      }
      const savedWater = loadDraft<WaterSourceFormData>('impact-water');
      if (savedWater) {
        Object.entries(savedWater).forEach(([key, value]) => {
          waterForm.setValue(key as keyof WaterSourceFormData, value as any)
        })
      }
      const savedTree = loadDraft<TreeFormData>('impact-tree');
      if (savedTree) {
        Object.entries(savedTree).forEach(([key, value]) => {
          treeForm.setValue(key as keyof TreeFormData, value as any)
        })
      }
    }
  }, []);

  useAutoSave({ form: beneficiaryForm, draftKey: 'impact-beneficiary', delay: 2000 });
  useAutoSave({ form: waterForm, draftKey: 'impact-water', delay: 2000 });
  useAutoSave({ form: treeForm, draftKey: 'impact-tree', delay: 2000 });

  const handleSchoolChange = (schoolId: string, schoolName: string) => {
    beneficiaryForm.setValue('schoolId', schoolId);
    beneficiaryForm.setValue('schoolName', schoolName);
    waterForm.setValue('schoolId', schoolId);
    waterForm.setValue('schoolName', schoolName);
    treeForm.setValue('schoolId', schoolId);
    treeForm.setValue('schoolName', schoolName);
  };

  const onBeneficiarySubmit = async (data: BeneficiaryFormData) => {
    const result = await submit({
      collectionName: 'sx-beneficiaries',
      data: { ...data, coordinates: coordinates || undefined },
      idempotencyKey: `ben_${data.schoolId}_${data.date}_${data.beneficiaryType}_${Date.now()}`,
    });
    if (result.isOffline) {
      toast({ title: 'Saved Offline', description: 'Beneficiary queued — will sync when you reconnect.' });
    } else if (result.isQueued) {
      toast({ title: 'Saved', description: 'Queued for sync when connected.' });
      clearDraft('impact-beneficiary');
    } else {
      toast({ title: 'Beneficiary Logged', description: `${data.beneficiaryType} recorded for ${data.schoolName}.` });
      clearDraft('impact-beneficiary');
    }
    router.push(data.schoolId ? `/school-xperience/${data.schoolId}` : '/school-xperience');
  };

  const onWaterSubmit = async (data: WaterSourceFormData) => {
    const result = await submit({
      collectionName: 'sx-water-sources',
      data: { ...data, coordinates: coordinates || undefined },
      idempotencyKey: `water_${data.schoolId}_${data.date}_${data.sourceType}_${Date.now()}`,
    });
    if (result.isOffline) {
      toast({ title: 'Saved Offline', description: 'Water source queued — will sync when you reconnect.' });
    } else if (result.isQueued) {
      toast({ title: 'Saved', description: 'Queued for sync when connected.' });
      clearDraft('impact-water');
    } else {
      toast({ title: 'Water Source Logged', description: `${data.sourceType} recorded for ${data.schoolName}.` });
      clearDraft('impact-water');
    }
    router.push(data.schoolId ? `/school-xperience/${data.schoolId}` : '/school-xperience');
  };

  const onTreeSubmit = async (data: TreeFormData) => {
    const result = await submit({
      collectionName: 'sx-trees',
      data: { ...data, coordinates: coordinates || undefined },
      idempotencyKey: `tree_${data.schoolId}_${data.date}_${data.treeType}_${Date.now()}`,
    });
    if (result.isOffline) {
      toast({ title: 'Saved Offline', description: 'Trees queued — will sync when you reconnect.' });
    } else if (result.isQueued) {
      toast({ title: 'Saved', description: 'Queued for sync when connected.' });
      clearDraft('impact-tree');
    } else {
      toast({ title: 'Trees Logged', description: `${data.quantity} trees recorded for ${data.schoolName}.` });
      clearDraft('impact-tree');
    }
    router.push(data.schoolId ? `/school-xperience/${data.schoolId}` : '/school-xperience');
  };

  return (
    <div className="enterprise-form-shell">
      <Button variant="outline" asChild className="rounded-xl border-lg">
        <Link href="/school-xperience"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Link>
      </Button>
      <Card className="border-lg shadow-comic-sm">
        <CardHeader className="bg-muted/30 border-b-lg border-omuto-navy/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter">
            {activeTab === 'beneficiary' && <Users className="h-8 w-8 text-primary" />}
            {activeTab === 'water' && <Droplets className="h-8 w-8 text-primary" />}
            {activeTab === 'tree' && <TreePine className="h-8 w-8 text-primary" />}
            Log {activeTab === 'beneficiary' ? 'Beneficiary' : activeTab === 'water' ? 'Water Source' : 'Trees'}
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest">
            Record {activeTab === 'beneficiary' ? 'beneficiaries served' : activeTab === 'water' ? 'water sources' : 'trees planted'} with GPS coordinates.
          </CardDescription>
          <div className="mt-2">
            <OfflineStatus />
          </div>
        </CardHeader>

        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('beneficiary')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === 'beneficiary' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <Users className="h-4 w-4 mx-auto mb-1" />
              Beneficiary
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === 'water' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <Droplets className="h-4 w-4 mx-auto mb-1" />
              Water Source
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === 'tree' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <TreePine className="h-4 w-4 mx-auto mb-1" />
              Trees
            </button>
          </div>
        </div>

        {activeTab === 'beneficiary' && (
          <form onSubmit={beneficiaryForm.handleSubmit(onBeneficiarySubmit)}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">School *</Label>
                  <Select
                    value={beneficiaryForm.watch('schoolId')}
                    onValueChange={(val) => {
                      const school = schools?.find((s) => s.id === val);
                      handleSchoolChange(val, school?.schoolName || '');
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm">
                      <SelectValue placeholder="Select school..." />
                    </SelectTrigger>
                    <SelectContent>{schools?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.schoolName}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Date *</Label>
                  <Input type="date" {...beneficiaryForm.register('date')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Beneficiary Type *</Label>
                  <Select onValueChange={(val) => beneficiaryForm.setValue('beneficiaryType', val as any)} value={beneficiaryForm.watch('beneficiaryType')}>
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="community_member">Community Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Gender *</Label>
                  <Select onValueChange={(val) => beneficiaryForm.setValue('gender', val as any)} value={beneficiaryForm.watch('gender')}>
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Age Group *</Label>
                  <Select onValueChange={(val) => beneficiaryForm.setValue('ageGroup', val as any)} value={beneficiaryForm.watch('ageGroup')}>
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_10">Under 10</SelectItem>
                      <SelectItem value="10_14">10-14</SelectItem>
                      <SelectItem value="15_19">15-19</SelectItem>
                      <SelectItem value="20_24">20-24</SelectItem>
                      <SelectItem value="25_plus">25+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Programme *</Label>
                <Select onValueChange={(val) => beneficiaryForm.setValue('programme', val as any)} value={beneficiaryForm.watch('programme')}>
                  <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RED">RED Campaign</SelectItem>
                    <SelectItem value="PureWater">PureWater</SelectItem>
                    <SelectItem value="GreenSchools">GreenSchools</SelectItem>
                    <SelectItem value="SLF">SLF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Services Provided *</Label>
                <div className="flex flex-wrap gap-2">
                  {BENEFIT_SERVICES.map((service) => (
                    <Button
                      key={service}
                      type="button"
                      variant={beneficiaryForm.watch('servicesProvided')?.includes(service) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const current = beneficiaryForm.watch('servicesProvided') || [];
                        if (current.includes(service)) {
                          beneficiaryForm.setValue('servicesProvided', current.filter((x) => x !== service));
                        } else {
                          beneficiaryForm.setValue('servicesProvided', [...current, service]);
                        }
                      }}
                      className="h-10 rounded-xl font-bold text-xs"
                    >
                      {beneficiaryForm.watch('servicesProvided')?.includes(service) && <Check className="mr-1 h-3 w-3" />}
                      {service}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Recorded By *</Label>
                <Input {...beneficiaryForm.register('recordedBy')} placeholder="Your name" className="border-lg rounded-xl h-12 font-bold" />
              </div>

              <GPSLocationPicker
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                label="Beneficiary Location"
              />
            </CardContent>
            <CardFooter className="enterprise-form-footer">
              <Button type="submit" disabled={beneficiaryForm.formState.isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
                {beneficiaryForm.formState.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Users className="mr-2 h-5 w-5" />}
                Log Beneficiary
              </Button>
            </CardFooter>
          </form>
        )}

        {activeTab === 'water' && (
          <form onSubmit={waterForm.handleSubmit(onWaterSubmit)}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">School *</Label>
                  <Select
                    value={waterForm.watch('schoolId')}
                    onValueChange={(val) => {
                      const school = schools?.find((s) => s.id === val);
                      handleSchoolChange(val, school?.schoolName || '');
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm">
                      <SelectValue placeholder="Select school..." />
                    </SelectTrigger>
                    <SelectContent>{schools?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.schoolName}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Date *</Label>
                  <Input type="date" {...waterForm.register('date')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Source Type *</Label>
                  <Select onValueChange={(val) => waterForm.setValue('sourceType', val as any)} value={waterForm.watch('sourceType')}>
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borehole">Borehole</SelectItem>
                      <SelectItem value="rainwater_harvest">Rainwater Harvest</SelectItem>
                      <SelectItem value="protected_well">Protected Well</SelectItem>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="pipeline">Pipeline</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Status *</Label>
                  <Select onValueChange={(val) => waterForm.setValue('status', val as any)} value={waterForm.watch('status')}>
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="needs_repair">Needs Repair</SelectItem>
                      <SelectItem value="non_functional">Non-Functional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Water Quality *</Label>
                  <Select onValueChange={(val) => waterForm.setValue('waterQuality', val as any)} value={waterForm.watch('waterQuality')}>
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safe">Safe</SelectItem>
                      <SelectItem value="needs_treatment">Needs Treatment</SelectItem>
                      <SelectItem value="unsafe">Unsafe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Estimated Beneficiaries *</Label>
                <Input type="number" {...waterForm.register('estimatedBeneficiaries')} className="border-lg rounded-xl h-12 font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Recorded By *</Label>
                <Input {...waterForm.register('recordedBy')} placeholder="Your name" className="border-lg rounded-xl h-12 font-bold" />
              </div>

              <GPSLocationPicker
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                label="Water Source Location"
              />
            </CardContent>
            <CardFooter className="enterprise-form-footer">
              <Button type="submit" disabled={waterForm.formState.isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
                {waterForm.formState.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Droplets className="mr-2 h-5 w-5" />}
                Log Water Source
              </Button>
            </CardFooter>
          </form>
        )}

        {activeTab === 'tree' && (
          <form onSubmit={treeForm.handleSubmit(onTreeSubmit)}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">School *</Label>
                  <Select
                    value={treeForm.watch('schoolId')}
                    onValueChange={(val) => {
                      const school = schools?.find((s) => s.id === val);
                      handleSchoolChange(val, school?.schoolName || '');
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm">
                      <SelectValue placeholder="Select school..." />
                    </SelectTrigger>
                    <SelectContent>{schools?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.schoolName}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Date *</Label>
                  <Input type="date" {...treeForm.register('date')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Tree Type *</Label>
                  <Select onValueChange={(val) => treeForm.setValue('treeType', val as any)} value={treeForm.watch('treeType')}>
                    <SelectTrigger className="h-12 rounded-xl border-lg font-bold text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fruit">Fruit Trees</SelectItem>
                      <SelectItem value="timber">Timber Trees</SelectItem>
                      <SelectItem value="shade">Shade Trees</SelectItem>
                      <SelectItem value="medicinal">Medicinal Trees</SelectItem>
                      <SelectItem value="native">Native Trees</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Quantity *</Label>
                  <Input type="number" {...treeForm.register('quantity')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Survival Count</Label>
                  <Input type="number" {...treeForm.register('survivalCount')} placeholder="Optional" className="border-lg rounded-xl h-12 font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Planting Area</Label>
                <Input {...treeForm.register('plantingArea')} placeholder="e.g., School compound, near borehole" className="border-lg rounded-xl h-12 font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Recorded By *</Label>
                <Input {...treeForm.register('recordedBy')} placeholder="Your name" className="border-lg rounded-xl h-12 font-bold" />
              </div>

              <GPSLocationPicker
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                label="Planting Location"
              />
            </CardContent>
            <CardFooter className="enterprise-form-footer">
              <Button type="submit" disabled={treeForm.formState.isSubmitting} className="btn-omuto w-full h-14 text-sm font-black uppercase tracking-widest shadow-comic-lg rounded-2xl">
                {treeForm.formState.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <TreePine className="mr-2 h-5 w-5" />}
                Log Trees
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export function LogImpactForm() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LogImpactFormInner />
    </Suspense>
  );
}
