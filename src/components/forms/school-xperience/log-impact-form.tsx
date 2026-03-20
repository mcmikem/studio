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
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, Users, Droplets, TreePine, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { GPSLocationPicker } from '@/components/ui/gps-location-picker';
import type { SchoolXperience } from '@/lib/types';

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

  const handleSchoolChange = (schoolId: string, schoolName: string) => {
    beneficiaryForm.setValue('schoolId', schoolId);
    beneficiaryForm.setValue('schoolName', schoolName);
    waterForm.setValue('schoolId', schoolId);
    waterForm.setValue('schoolName', schoolName);
    treeForm.setValue('schoolId', schoolId);
    treeForm.setValue('schoolName', schoolName);
  };

  const onBeneficiarySubmit = (data: BeneficiaryFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'sx-beneficiaries'), {
      ...data,
      coordinates: coordinates || undefined,
      createdAt: serverTimestamp(),
      createdBy: 'system',
    });

    toast({ title: 'Beneficiary Logged', description: `${data.beneficiaryType} recorded for ${data.schoolName}.` });
    router.push(data.schoolId ? `/school-xperience/${data.schoolId}` : '/school-xperience');
  };

  const onWaterSubmit = (data: WaterSourceFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'sx-water-sources'), {
      ...data,
      coordinates: coordinates || undefined,
      createdAt: serverTimestamp(),
      createdBy: 'system',
    });

    toast({ title: 'Water Source Logged', description: `${data.sourceType} recorded for ${data.schoolName}.` });
    router.push(data.schoolId ? `/school-xperience/${data.schoolId}` : '/school-xperience');
  };

  const onTreeSubmit = (data: TreeFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Database connection failed.' });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'sx-trees'), {
      ...data,
      coordinates: coordinates || undefined,
      createdAt: serverTimestamp(),
      createdBy: 'system',
    });

    toast({ title: 'Trees Logged', description: `${data.quantity} trees recorded for ${data.schoolName}.` });
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
                  <select
                    value={beneficiaryForm.watch('schoolId')}
                    onChange={(e) => {
                      const school = schools?.find((s) => s.id === e.target.value);
                      handleSchoolChange(e.target.value, school?.schoolName || '');
                    }}
                    className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
                  >
                    <option value="">Select school...</option>
                    {schools?.map((s) => (
                      <option key={s.id} value={s.id}>{s.schoolName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Date *</Label>
                  <Input type="date" {...beneficiaryForm.register('date')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Beneficiary Type *</Label>
                  <select {...beneficiaryForm.register('beneficiaryType')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="community_member">Community Member</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Gender *</Label>
                  <select {...beneficiaryForm.register('gender')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Age Group *</Label>
                  <select {...beneficiaryForm.register('ageGroup')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="under_10">Under 10</option>
                    <option value="10_14">10-14</option>
                    <option value="15_19">15-19</option>
                    <option value="20_24">20-24</option>
                    <option value="25_plus">25+</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest">Programme *</Label>
                <select {...beneficiaryForm.register('programme')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                  <option value="RED">RED Campaign</option>
                  <option value="PureWater">PureWater</option>
                  <option value="GreenSchools">GreenSchools</option>
                  <option value="SLF">SLF</option>
                </select>
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
                  <select
                    value={waterForm.watch('schoolId')}
                    onChange={(e) => {
                      const school = schools?.find((s) => s.id === e.target.value);
                      handleSchoolChange(e.target.value, school?.schoolName || '');
                    }}
                    className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
                  >
                    <option value="">Select school...</option>
                    {schools?.map((s) => (
                      <option key={s.id} value={s.id}>{s.schoolName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Date *</Label>
                  <Input type="date" {...waterForm.register('date')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Source Type *</Label>
                  <select {...waterForm.register('sourceType')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="borehole">Borehole</option>
                    <option value="rainwater_harvest">Rainwater Harvest</option>
                    <option value="protected_well">Protected Well</option>
                    <option value="spring">Spring</option>
                    <option value="pipeline">Pipeline</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Status *</Label>
                  <select {...waterForm.register('status')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="functional">Functional</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="non_functional">Non-Functional</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Water Quality *</Label>
                  <select {...waterForm.register('waterQuality')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="safe">Safe</option>
                    <option value="needs_treatment">Needs Treatment</option>
                    <option value="unsafe">Unsafe</option>
                  </select>
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
                  <select
                    value={treeForm.watch('schoolId')}
                    onChange={(e) => {
                      const school = schools?.find((s) => s.id === e.target.value);
                      handleSchoolChange(e.target.value, school?.schoolName || '');
                    }}
                    className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
                  >
                    <option value="">Select school...</option>
                    {schools?.map((s) => (
                      <option key={s.id} value={s.id}>{s.schoolName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Date *</Label>
                  <Input type="date" {...treeForm.register('date')} className="border-lg rounded-xl h-12 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest">Tree Type *</Label>
                  <select {...treeForm.register('treeType')} className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm">
                    <option value="fruit">Fruit Trees</option>
                    <option value="timber">Timber Trees</option>
                    <option value="shade">Shade Trees</option>
                    <option value="medicinal">Medicinal Trees</option>
                    <option value="native">Native Trees</option>
                    <option value="mixed">Mixed</option>
                  </select>
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
