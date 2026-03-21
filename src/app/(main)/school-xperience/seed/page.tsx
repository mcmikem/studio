'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, GraduationCap, Droplets, TreePine, Check } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';

const DEMO_SCHOOLS = [
  {
    schoolName: 'St. Mary\'s Primary School Kammengo',
    location: 'Kammengo Centre',
    subCounty: 'Kammengo',
    district: 'Mpigi',
    coordinates: { lat: 0.0920, lng: 32.2480 },
    patronTeacher: 'Namuli Sarah',
    patronPhone: '0771234567',
    patronEmail: 'stmarys.kammengo@schools.ug',
    enrollmentSize: 420,
    activeProgrammes: ['SLF', 'RED', 'GreenSchools'],
    status: 'Active',
    tier: 'Advanced',
  },
  {
    schoolName: 'Nabbuzi COU Primary School',
    location: 'Nabbuzi',
    subCounty: 'Kammengo',
    district: 'Mpigi',
    coordinates: { lat: 0.0880, lng: 32.2420 },
    patronTeacher: 'Muwonge Robert',
    patronPhone: '0772345678',
    enrollmentSize: 350,
    activeProgrammes: ['SLF', 'PureWater'],
    status: 'Active',
    tier: 'Active',
  },
  {
    schoolName: 'Kiringente Modern Primary School',
    location: 'Kiringente',
    subCounty: 'Kiringente',
    district: 'Mpigi',
    coordinates: { lat: 0.1200, lng: 32.1800 },
    patronTeacher: 'Nansubuga Fatuma',
    patronPhone: '0773456789',
    enrollmentSize: 380,
    activeProgrammes: ['RED', 'GreenSchools'],
    status: 'Active',
    tier: 'Active',
  },
  {
    schoolName: 'Mpigi Parents Primary School',
    location: 'Mpigi Town',
    subCounty: 'Mpigi Town Council',
    district: 'Mpigi',
    coordinates: { lat: 0.2330, lng: 32.3330 },
    patronTeacher: 'Kasule John',
    patronPhone: '0774567890',
    enrollmentSize: 550,
    activeProgrammes: ['SLF', 'RED', 'PureWater', 'GreenSchools'],
    status: 'Active',
    tier: 'Flagship',
  },
  {
    schoolName: 'Buwama Primary School',
    location: 'Buwama',
    subCounty: 'Buwama',
    district: 'Mpigi',
    coordinates: { lat: 0.1800, lng: 32.2800 },
    patronTeacher: 'Nakiyemba Josephine',
    patronPhone: '0775678901',
    enrollmentSize: 290,
    activeProgrammes: ['SLF', 'RED'],
    status: 'Active',
    tier: 'Partner',
  },
  {
    schoolName: 'St. Henry\'s Primary School Kyambogo',
    location: 'Kyambogo',
    subCounty: 'Muduuma',
    district: 'Mpigi',
    coordinates: { lat: 0.2500, lng: 32.1500 },
    patronTeacher: 'Mukasa David',
    patronPhone: '0776789012',
    enrollmentSize: 310,
    activeProgrammes: ['GreenSchools', 'PureWater'],
    status: 'Active',
    tier: 'Active',
  },
  {
    schoolName: 'Kyebando Primary School',
    location: 'Kyebando',
    subCounty: 'Kyebando',
    district: 'Wakiso',
    coordinates: { lat: 0.3510, lng: 32.4970 },
    patronTeacher: 'Namanda Grace',
    patronPhone: '0777890123',
    enrollmentSize: 480,
    activeProgrammes: ['SLF', 'RED', 'GreenSchools'],
    status: 'Active',
    tier: 'Advanced',
  },
  {
    schoolName: 'Kireka SDA Primary School',
    location: 'Kireka',
    subCounty: 'Kyebando',
    district: 'Wakiso',
    coordinates: { lat: 0.3580, lng: 32.5050 },
    patronTeacher: 'Ssekitoleko William',
    patronPhone: '0778901234',
    enrollmentSize: 395,
    activeProgrammes: ['RED', 'PureWater'],
    status: 'Active',
    tier: 'Active',
  },
];

const DEMO_WATER_SOURCES = [
  { schoolIndex: 0, sourceType: 'borehole', status: 'functional', waterQuality: 'safe', estimatedBeneficiaries: 420 },
  { schoolIndex: 1, sourceType: 'rainwater_harvest', status: 'functional', waterQuality: 'safe', estimatedBeneficiaries: 350 },
  { schoolIndex: 2, sourceType: 'borehole', status: 'needs_repair', waterQuality: 'needs_treatment', estimatedBeneficiaries: 300 },
  { schoolIndex: 3, sourceType: 'pipeline', status: 'functional', waterQuality: 'safe', estimatedBeneficiaries: 550 },
  { schoolIndex: 4, sourceType: 'protected_well', status: 'functional', waterQuality: 'safe', estimatedBeneficiaries: 250 },
];

const DEMO_BENEFICIARIES = [
  { schoolIndex: 0, beneficiaryType: 'student', gender: 'female', ageGroup: '10_14', programme: 'RED', count: 85 },
  { schoolIndex: 0, beneficiaryType: 'student', gender: 'female', ageGroup: '15_19', programme: 'RED', count: 42 },
  { schoolIndex: 1, beneficiaryType: 'student', gender: 'female', ageGroup: '10_14', programme: 'SLF', count: 60 },
  { schoolIndex: 2, beneficiaryType: 'student', gender: 'female', ageGroup: '15_19', programme: 'RED', count: 55 },
  { schoolIndex: 3, beneficiaryType: 'student', gender: 'female', ageGroup: '10_14', programme: 'SLF', count: 120 },
  { schoolIndex: 3, beneficiaryType: 'student', gender: 'female', ageGroup: '15_19', programme: 'RED', count: 95 },
];

const DEMO_TREES = [
  { schoolIndex: 0, treeType: 'fruit', quantity: 50 },
  { schoolIndex: 1, treeType: 'native', quantity: 30 },
  { schoolIndex: 2, treeType: 'timber', quantity: 25 },
  { schoolIndex: 3, treeType: 'fruit', quantity: 75 },
  { schoolIndex: 3, treeType: 'native', quantity: 40 },
  { schoolIndex: 4, treeType: 'shade', quantity: 20 },
];

export default function SeedDataPage() {
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string[]>([]);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore]);

  const { data: existingSchools } = useCollection<any>(schoolsQuery);

  const seedData = async () => {
    if (!firestore) return;
    setIsLoading(true);
    setResult([]);

    const added: string[] = [];

    // Check if schools already exist
    const existingNames = (existingSchools || []).map((s: any) => s.schoolName?.toLowerCase());

    // Add schools
    for (const school of DEMO_SCHOOLS) {
      if (existingNames.includes(school.schoolName.toLowerCase())) {
        added.push(`Skipped: ${school.schoolName} (exists)`);
        continue;
      }

      await addDocumentNonBlocking(collection(firestore, 'sx-schools'), {
        ...school,
        pipelineStage: 'Onboarded',
        term: 'Term 1',
        academicYear: '2026',
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
      added.push(`Added: ${school.schoolName}`);
    }

    // Small delay to let schools save
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add water sources
    for (const water of DEMO_WATER_SOURCES) {
      const school = DEMO_SCHOOLS[water.schoolIndex];
      await addDocumentNonBlocking(collection(firestore, 'sx-water-sources'), {
        schoolName: school.schoolName,
        schoolId: '',
        sourceType: water.sourceType,
        status: water.status,
        waterQuality: water.waterQuality,
        estimatedBeneficiaries: water.estimatedBeneficiaries,
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Seed Script',
        coordinates: school.coordinates,
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
    }
    added.push(`Added: ${DEMO_WATER_SOURCES.length} water sources`);

    // Add beneficiaries
    for (const ben of DEMO_BENEFICIARIES) {
      const school = DEMO_SCHOOLS[ben.schoolIndex];
      await addDocumentNonBlocking(collection(firestore, 'sx-beneficiaries'), {
        schoolName: school.schoolName,
        schoolId: '',
        beneficiaryType: ben.beneficiaryType,
        gender: ben.gender,
        ageGroup: ben.ageGroup,
        programme: ben.programme,
        servicesProvided: ['Menstrual hygiene management'],
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Seed Script',
        coordinates: { 
          lat: school.coordinates.lat + (Math.random() - 0.5) * 0.002,
          lng: school.coordinates.lng + (Math.random() - 0.5) * 0.002 
        },
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
    }
    added.push(`Added: ${DEMO_BENEFICIARIES.length} beneficiary records`);

    // Add trees
    for (const tree of DEMO_TREES) {
      const school = DEMO_SCHOOLS[tree.schoolIndex];
      await addDocumentNonBlocking(collection(firestore, 'sx-trees'), {
        schoolName: school.schoolName,
        schoolId: '',
        treeType: tree.treeType,
        quantity: tree.quantity,
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Seed Script',
        coordinates: { 
          lat: school.coordinates.lat + (Math.random() - 0.5) * 0.001,
          lng: school.coordinates.lng + (Math.random() - 0.5) * 0.001 
        },
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
    }
    added.push(`Added: ${DEMO_TREES.length} tree planting records`);

    setResult(added);
    setIsLoading(false);
  };

  return (
    <div className="container py-8 max-w-2xl">
      <Card className="border-lg shadow-lg">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Seed Demo Data
          </CardTitle>
          <CardDescription>
            Add sample schools with GPS coordinates and demo impact data to test the map.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="font-bold text-sm">This will add:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" /> 8 schools in Mpigi and Wakiso</li>
              <li className="flex items-center gap-2"><Droplets className="h-4 w-4 text-cyan-600" /> 5 water sources</li>
              <li className="flex items-center gap-2"><TreePine className="h-4 w-4 text-green-600" /> 6 tree planting records</li>
              <li className="flex items-center gap-2"><Plus className="h-4 w-4 text-pink-600" /> 6 beneficiary records</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Schools already in the database will be skipped.
            </p>
          </div>

          <Button 
            onClick={seedData} 
            disabled={isLoading} 
            className="w-full btn-omuto h-12 rounded-xl font-black uppercase tracking-widest"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Seeding data...</>
            ) : (
              <><Plus className="mr-2 h-5 w-5" /> Seed Demo Data</>
            )}
          </Button>

          {result.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1">
              <p className="font-bold text-green-700 flex items-center gap-2">
                <Check className="h-4 w-4" /> Done!
              </p>
              {result.map((msg, i) => (
                <p key={i} className="text-sm text-green-600">{msg}</p>
              ))}
              <p className="text-xs text-green-600 mt-2">
                Refresh the map page to see the new markers.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
