'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, GraduationCap, Droplets, TreePine, Check } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { MIGRATION_DATA } from '@/lib/data/migration-data';

const DEMO_SCHOOLS = [
  {
    schoolName: "Good shepherd primary school",
    district: "Bunyangabu District",
    level: "Primary",
    enrollmentSize: 323,
    patronTeacher: "Dennis Twinomugisha",
    patronEmail: "twinomugishadeniss2@gmail.com",
    patronPhone: "+256786539887",
    activeProgrammes: ["SX"], // Young Alive Clubs
    location: "Bunyangabu",
    subCounty: "Bunyangabu",
    coordinates: { lat: 0.3000, lng: 30.2000 }
  },
  {
    schoolName: "Mumboha Primary School",
    district: "Vihiga County",
    level: "Primary",
    enrollmentSize: 50,
    patronTeacher: "Roseline Auma",
    patronEmail: "aumaroseline12@gmail.com",
    patronPhone: "+254741860109",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Vihiga, Kenya",
    subCounty: "Vihiga",
    coordinates: { lat: 0.0000, lng: 34.7000 }
  },
  {
    schoolName: "Miranga mixed primary school",
    district: "Kisumu County",
    level: "Primary",
    enrollmentSize: 50,
    patronTeacher: "Roseline Auma",
    patronEmail: "aumaroseline12@gmail.com",
    patronPhone: "+254741860109",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Kisumu, Kenya",
    subCounty: "Kisumu",
    coordinates: { lat: -0.1000, lng: 34.7000 }
  },
  {
    schoolName: "St Bonoveture kanyike",
    district: "Mpigi District",
    level: "Primary",
    enrollmentSize: 500,
    patronTeacher: "Tr Sarah Namusoke",
    patronEmail: "Kanyikeps@gmail.com",
    patronPhone: "0753446663",
    activeProgrammes: ["RED", "GreenSchools", "Debate", "SLF"],
    location: "Mpigi",
    subCounty: "Mpigi",
    coordinates: { lat: 0.2000, lng: 32.3000 }
  },
  {
    schoolName: "Rahuma Junior school",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 250,
    patronTeacher: "Serunjogi Musa",
    patronEmail: "yusufumuwanguzi37@gmail.co.com",
    patronPhone: "0742139077",
    activeProgrammes: ["SX", "RED"],
    location: "Kibibi subcounty",
    subCounty: "Kibibi",
    coordinates: { lat: 0.1700, lng: 32.1100 }
  },
  {
    schoolName: "God's mercy kindergarten and primary School",
    district: "Mpigi",
    level: "Primary",
    enrollmentSize: 210,
    patronTeacher: "Ssentongo Fred",
    patronEmail: "fredysyntongo@gmail.com",
    patronPhone: "0756161576",
    activeProgrammes: ["GreenSchools", "Debate"],
    location: "Nfunvu mpigi",
    subCounty: "Nfunvu",
    coordinates: { lat: 0.1500, lng: 32.2000 }
  },
  {
    schoolName: "Buwama modern",
    district: "Mpigi district",
    level: "Primary",
    enrollmentSize: 388,
    patronTeacher: "H/T. Nakibuule margret",
    patronEmail: "nakibuulemargret17@gmail.com",
    patronPhone: "0753575336",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Lubugumu",
    subCounty: "Lubugumu",
    coordinates: { lat: 0.1700, lng: 32.3000 }
  },
  {
    schoolName: "Kammengo primary School",
    district: "Mpigi",
    level: "Primary",
    enrollmentSize: 253,
    patronTeacher: "Nantege Milly",
    patronEmail: "millynantege58@gmail.com",
    patronPhone: "0775515152",
    activeProgrammes: ["RED", "GreenSchools", "Debate"],
    location: "Kammengo -mpigi",
    subCounty: "Kammengo",
    coordinates: { lat: 0.0800, lng: 32.2000 }
  },
  {
    schoolName: "Kingdom junior school kammengo",
    district: "Mpigi",
    level: "Primary",
    enrollmentSize: 294,
    patronTeacher: "Nakabugo Cissy",
    patronEmail: "Nakspatience@gmail.com",
    patronPhone: "0705573645",
    activeProgrammes: ["RED", "GreenSchools", "Debate", "SLF"],
    location: "Kammengo",
    subCounty: "Kammengo",
    coordinates: { lat: 0.0810, lng: 32.2010 }
  },
  {
    schoolName: "Kikunyu infant and primary School",
    district: "Mpigi",
    level: "Primary",
    enrollmentSize: 300,
    patronTeacher: "Nankabirwa Ester",
    patronEmail: "kikunyuinfant@gmail.com",
    patronPhone: "0782638764",
    activeProgrammes: ["SX", "Debate", "SLF"],
    location: "Kammengo",
    subCounty: "Kammengo",
    coordinates: { lat: 0.0790, lng: 32.1990 }
  },
  {
    schoolName: "St.Bruno primary school mmembe",
    district: "Mpigi district",
    level: "Primary",
    enrollmentSize: 498,
    patronTeacher: "Patrick",
    patronEmail: "patrickdaprince17@gmail.com",
    patronPhone: "0753639769",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Mmembe village",
    subCounty: "Mpigi Town Council",
    coordinates: { lat: 0.2200, lng: 32.3200 }
  },
  {
    schoolName: "J&J learning center kammengo",
    district: "Mpigi",
    level: "Primary",
    enrollmentSize: 209,
    patronTeacher: "Omuut Daniel",
    patronEmail: "omuut0136@gmail.com",
    patronPhone: "0742007747",
    activeProgrammes: ["SX", "RED", "Debate"],
    location: "Kammengo",
    subCounty: "Kammengo",
    coordinates: { lat: 0.0820, lng: 32.2020 }
  },
  {
    schoolName: "St.Anne primary school kkonge",
    district: "Mpigi district",
    level: "Primary",
    enrollmentSize: 568,
    patronTeacher: "Patrick",
    patronEmail: "patrickdaprince17@gmail.com",
    patronPhone: "0782400454",
    activeProgrammes: ["SX", "RED", "GreenSchools"],
    location: "Kkonge village",
    subCounty: "Mpigi Town Council",
    coordinates: { lat: 0.2100, lng: 32.3100 }
  },
  {
    schoolName: "BURAAQ quranic school",
    district: "Mpigi",
    level: "Primary",
    enrollmentSize: 350,
    patronTeacher: "Muusa Adam",
    patronEmail: "adammuusa12@gmail.com",
    patronPhone: "0740784626",
    activeProgrammes: ["RED", "GreenSchools", "Debate", "SLF"],
    location: "Mpigi",
    subCounty: "Mpigi",
    coordinates: { lat: 0.2310, lng: 32.3310 }
  },
  {
    schoolName: "KIBIBI ISLAMIC PRIMARY SCHOOL",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 130,
    patronTeacher: "Costantine",
    patronEmail: "kasiryecostantine@gmail.com",
    patronPhone: "0702123682",
    activeProgrammes: ["GreenSchools", "Debate", "SLF"],
    location: "Kibibi katende zone",
    subCounty: "Kibibi",
    coordinates: { lat: 0.1710, lng: 32.1110 }
  },
  {
    schoolName: "UMAR INFANT PRIMARY AND ORPHANAGE CENTER",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 325,
    patronTeacher: "Costantine",
    patronEmail: "kasiryecostantine@gmail.com",
    patronPhone: "0772856893",
    activeProgrammes: ["GreenSchools", "Debate", "SLF"],
    location: "Kibibi Butaaka zone",
    subCounty: "Kibibi",
    coordinates: { lat: 0.1690, lng: 32.1090 }
  },
  {
    schoolName: "Buyijja kabira primary school",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 450,
    patronTeacher: "Namugambe Gorret",
    patronEmail: "ashrafssekanjako23@gmail.com",
    patronPhone: "0700854719",
    activeProgrammes: ["RED", "GreenSchools", "Debate", "SLF"],
    location: "Kabira",
    subCounty: "Gombe",
    coordinates: { lat: 0.1400, lng: 32.0900 }
  },
  {
    schoolName: "KIBIBI CHURCH OF UGANDA",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 500,
    patronTeacher: "Costantine",
    patronEmail: "kasiryecostantine@gmail.co",
    patronPhone: "0772426100",
    activeProgrammes: ["RED", "GreenSchools", "Debate", "SLF"],
    location: "Kibibi Simba A",
    subCounty: "Kibibi",
    coordinates: { lat: 0.1700, lng: 32.1120 }
  },
  {
    schoolName: "St. Peters primary school kabira",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 303,
    patronTeacher: "Nakaweesa jackline",
    patronEmail: "ashrafssekanjako23@gmail.com",
    patronPhone: "0754589636",
    activeProgrammes: ["RED", "Debate", "SLF"],
    location: "Buyijja kabira",
    subCounty: "Gombe",
    coordinates: { lat: 0.1410, lng: 32.0910 }
  },
  {
    schoolName: "Jjalamba primary school",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 328,
    patronTeacher: "Nansereko Mary",
    patronEmail: "nansubugaallen6@gmail.com",
    patronPhone: "0774965350",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Jjalamba",
    subCounty: "Gombe",
    coordinates: { lat: 0.1390, lng: 32.0890 }
  },
  {
    schoolName: "Reynold Primary School Kamengo",
    district: "Mpigi District",
    level: "Primary",
    enrollmentSize: 100,
    patronTeacher: "Reynold",
    patronEmail: "reynoldps23@gmail.com",
    patronPhone: "0751563139",
    activeProgrammes: ["Debate", "SLF"],
    location: "Mpigi, Central",
    subCounty: "Kammengo",
    coordinates: { lat: 0.0830, lng: 32.2030 }
  },
  {
    schoolName: "St.KIZITO SSEYONMO PRIMARY SCHOOL",
    district: "Butambala District",
    level: "Primary",
    enrollmentSize: 410,
    patronTeacher: "Bwanika Rose Nalwanga",
    patronEmail: "bwirebashir55@gmail.com",
    patronPhone: "0750306368",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "GOMBE TOWN COUNCIL",
    subCounty: "Gombe",
    coordinates: { lat: 0.1420, lng: 32.0920 }
  },
  {
    schoolName: "St. Luke Ntolomwe catholic school",
    district: "Butambala District",
    level: "Primary",
    enrollmentSize: 201,
    patronTeacher: "Zziggwa chales",
    patronEmail: "bwirebashir55@gmail.com",
    patronPhone: "0757261300",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Gombe town council",
    subCounty: "Gombe",
    coordinates: { lat: 0.1430, lng: 32.0930 }
  },
  {
    schoolName: "Ntolomwe umea primary school",
    district: "Butambala District",
    level: "Primary",
    enrollmentSize: 306,
    patronTeacher: "Omar Bashir ssebanakita",
    patronEmail: "bwirebashir55@gmail.com",
    patronPhone: "0755929374",
    activeProgrammes: ["SX", "RED", "Debate", "SLF"],
    location: "Ntolomwe parish",
    subCounty: "Gombe",
    coordinates: { lat: 0.1440, lng: 32.0940 }
  },
  {
    schoolName: "Gombe Umea primary school",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 600,
    patronTeacher: "Namiro Zaamu",
    patronEmail: "bwirebashir55@gmail.com",
    patronPhone: "0751113005",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Gombe town council",
    subCounty: "Gombe",
    coordinates: { lat: 0.1380, lng: 32.0880 }
  },
  {
    schoolName: "St Charles lwanga kayenje c/s",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 568,
    patronTeacher: "Nkujulu fred",
    patronEmail: "bwirebashir55@gmail.com",
    patronPhone: "0703512342",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Gombe town council",
    subCounty: "Gombe",
    coordinates: { lat: 0.1370, lng: 32.0870 }
  },
  {
    schoolName: "Excel primary school",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 320,
    patronTeacher: "John Nicolas Okiso",
    patronEmail: "bwirebashir55@gmail.com",
    patronPhone: "0707253911",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Gombe subcounty",
    subCounty: "Gombe",
    coordinates: { lat: 0.1360, lng: 32.0860 }
  },
  {
    schoolName: "Kibibi church of Uganda primary school",
    district: "Butambala district",
    level: "Primary",
    enrollmentSize: 422,
    patronTeacher: "Keya Joseph",
    patronEmail: "bwirebashir55@gmail.com",
    patronPhone: "0705551646",
    activeProgrammes: ["SX", "RED", "GreenSchools", "Debate", "SLF"],
    location: "Kibibi subcounty",
    subCounty: "Kibibi",
    coordinates: { lat: 0.1720, lng: 32.1120 }
  }
];

const DEMO_WATER_SOURCES = [
  { schoolIndex: 0, sourceType: 'borehole', status: 'functional', waterQuality: 'safe', estimatedBeneficiaries: 323 },
  { schoolIndex: 3, sourceType: 'rainwater_harvest', status: 'functional', waterQuality: 'safe', estimatedBeneficiaries: 500 },
  { schoolIndex: 6, sourceType: 'borehole', status: 'needs_repair', waterQuality: 'needs_treatment', estimatedBeneficiaries: 388 },
  { schoolIndex: 10, sourceType: 'pipeline', status: 'functional', waterQuality: 'safe', estimatedBeneficiaries: 498 },
  { schoolIndex: 27, sourceType: 'protected_well', status: 'functional', waterQuality: 'safe', estimatedBeneficiaries: 422 },
];

const DEMO_BENEFICIARIES = [
  { schoolIndex: 0, beneficiaryType: 'student', gender: 'female', ageGroup: '10_14', programme: 'SX', count: 85 },
  { schoolIndex: 3, beneficiaryType: 'student', gender: 'female', ageGroup: '15_19', programme: 'RED', count: 42 },
  { schoolIndex: 6, beneficiaryType: 'student', gender: 'female', ageGroup: '10_14', programme: 'GREEN', count: 60 },
  { schoolIndex: 10, beneficiaryType: 'student', gender: 'female', ageGroup: '15_19', programme: 'SX', count: 55 },
  { schoolIndex: 20, beneficiaryType: 'student', gender: 'female', ageGroup: '10_14', programme: 'SLF', count: 120 },
  { schoolIndex: 27, beneficiaryType: 'student', gender: 'female', ageGroup: '15_19', programme: 'RED', count: 95 },
];

const DEMO_TREES = [
  { schoolIndex: 0, treeType: 'fruit', quantity: 50 },
  { schoolIndex: 3, treeType: 'native', quantity: 30 },
  { schoolIndex: 6, treeType: 'timber', quantity: 25 },
  { schoolIndex: 10, treeType: 'fruit', quantity: 75 },
  { schoolIndex: 20, treeType: 'native', quantity: 40 },
  { schoolIndex: 27, treeType: 'shade', quantity: 20 },
];

export default function SeedDataPage() {
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<string[]>([]);
  const [migResult, setMigResult] = useState<string[]>([]);

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

  const runInstitutionalMigration = async () => {
    if (!firestore) return;
    setIsMigrating(true);
    setMigResult([]);

    const msgs: string[] = [];

    // 1. Seed Subcounty Coords (Approximate for Mpigi)
    const SUBCOUNTY_COORDS: any = {
      'Mpigi': { lat: 0.2300, lng: 32.3330 },
      'Kammengo': { lat: 0.0900, lng: 32.2480 },
      'Kiringente': { lat: 0.1200, lng: 32.1800 },
      'Muduuma': { lat: 0.2500, lng: 32.1500 },
      'Buwama': { lat: 0.1800, lng: 32.2800 },
      'Kibibi': { lat: 0.1700, lng: 32.1100 },
      'Gombe': { lat: 0.1400, lng: 32.0900 },
      'Mpigi Town Council': { lat: 0.2250, lng: 32.3250 }
    };

    // 2. Map Schools
    const schoolIdMap = new Map();
    const existingNames = (existingSchools || []).map((s: any) => s.schoolName?.toLowerCase());

    for (const s of MIGRATION_DATA.schools) {
        if (existingNames.includes(s.name.toLowerCase())) {
            msgs.push(`Skipped: ${s.name} (exists)`);
            continue;
        }

        const coords = SUBCOUNTY_COORDS[s.sc] || SUBCOUNTY_COORDS['Mpigi Town Council'];
        const docRef = doc(collection(firestore, 'sx-schools'));
        await setDoc(docRef, {
            schoolName: s.name,
            patronTeacher: s.patron || 'TBD',
            subCounty: s.sc || 'Other',
            district: 'Mpigi',
            activeProgrammes: s.progs,
            status: 'Active',
            tier: 'Partner',
            pipelineStage: 'Onboarded',
            term: 'Term 1',
            academicYear: '2026',
            coordinates: {
                lat: coords.lat + (Math.random() - 0.5) * 0.005,
                lng: coords.lng + (Math.random() - 0.5) * 0.005
            },
            createdAt: serverTimestamp(),
            createdBy: 'migration-institutional'
        });
        schoolIdMap.set(s.name.toLowerCase(), docRef.id);
        msgs.push(`Added School: ${s.name}`);
    }

    // 3. Map Football Teams
    for (const t of MIGRATION_DATA.teams) {
        await addDocumentNonBlocking(collection(firestore, 'sx-ofa-teams'), {
            teamName: t.name,
            headCoachName: t.coach || 'TBD',
            subcounty: t.sc || '',
            district: 'Mpigi',
            status: 'Active',
            createdAt: serverTimestamp()
        });
        msgs.push(`Added Team: ${t.name}`);
    }

    // 4. Map Trees & Water
    for (const tree of MIGRATION_DATA.trees) {
        await addDocumentNonBlocking(collection(firestore, 'sx-trees'), {
            schoolName: tree.school,
            quantity: parseFloat(tree.qty) || 0,
            date: tree.date || new Date().toISOString().split('T')[0],
            treeType: 'Mixed',
            createdAt: serverTimestamp()
        });
    }
    msgs.push(`Added ${MIGRATION_DATA.trees.length} tree planting records`);

    for (const w of MIGRATION_DATA.water) {
        await addDocumentNonBlocking(collection(firestore, 'sx-water-sources'), {
            schoolName: w.school,
            sourceType: 'Purifier',
            status: 'functional',
            estimatedBeneficiaries: parseInt(w.ben) || 50,
            createdAt: serverTimestamp()
        });
    }
    msgs.push(`Added ${MIGRATION_DATA.water.length} purifier records`);

    // 5. Map Players
    for (const p of MIGRATION_DATA.players) {
        await addDocumentNonBlocking(collection(firestore, 'sx-ofa-players'), {
            playerName: p.name,
            teamName: p.team,
            age: p.age,
            academicClass: p.class,
            createdAt: serverTimestamp()
        });
    }
    msgs.push(`Added ${MIGRATION_DATA.players.length} player records`);

    // 6. Map Beneficiaries (440+)
    for (const b of MIGRATION_DATA.beneficiaries) {
         await addDocumentNonBlocking(collection(firestore, 'sx-beneficiaries'), {
            name: b.name,
            schoolName: b.school,
            programEnrolled: b.prog,
            gender: b.gender || 'Other',
            createdAt: serverTimestamp()
        });
    }
    msgs.push(`Added ${MIGRATION_DATA.beneficiaries.length} beneficiary records`);

    setMigResult(msgs);
    setIsMigrating(false);
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
              <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" /> 28 schools from the application dataset</li>
              <li className="flex items-center gap-2"><Droplets className="h-4 w-4 text-cyan-600" /> 5 sample water sources</li>
              <li className="flex items-center gap-2"><TreePine className="h-4 w-4 text-green-600" /> 5 tree planting records</li>
              <li className="flex items-center gap-2"><Plus className="h-4 w-4 text-pink-600" /> 6 beneficiary records</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Schools already in the database will be skipped.
            </p>
          </div>

          <Button 
            onClick={seedData} 
            disabled={isLoading || isMigrating} 
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

      <Card className="border-lg shadow-lg">
        <CardHeader className="bg-indigo-50/50 border-b">
          <CardTitle className="text-indigo-900 flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Institutional Migration
          </CardTitle>
          <CardDescription>
            Seed the entire system with the 2025 Institutional dataset (Schools, OFA Teams, Impacts).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="bg-indigo-50/30 rounded-xl p-4 space-y-2">
            <p className="font-bold text-sm text-indigo-900">This will migrate:</p>
            <ul className="text-sm space-y-1 text-indigo-800">
              <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Comprehensive School Database (60 entries)</li>
              <li className="flex items-center gap-2"><Plus className="h-4 w-4" /> OFA Football Teams (22 entries)</li>
              <li className="flex items-center gap-2"><Plus className="h-4 w-4" /> OFA Player Database (Individual records)</li>
              <li className="flex items-center gap-2"><TreePine className="h-4 w-4" /> 2025 Tree Survival Data</li>
              <li className="flex items-center gap-2"><Droplets className="h-4 w-4" /> Purifier Beneficiary Records</li>
              <li className="flex items-center gap-2"><Plus className="h-4 w-4" /> SLF, Debate, YoSkills & Menstrual (440+ Participants)</li>
            </ul>
          </div>

          <Button 
            onClick={runInstitutionalMigration} 
            disabled={isLoading || isMigrating} 
            variant="outline"
            className="w-full border-2 border-indigo-200 text-indigo-700 h-12 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-50"
          >
            {isMigrating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Migrating records...</>
            ) : (
              <><Plus className="mr-2 h-5 w-5" /> Run Master Migration</>
            )}
          </Button>

          {migResult.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-1">
              <p className="font-bold text-indigo-700 flex items-center gap-2">
                <Check className="h-4 w-4" /> Migration Complete!
              </p>
              <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {migResult.map((msg, i) => (
                  <p key={i} className="text-xs text-indigo-600">{msg}</p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
