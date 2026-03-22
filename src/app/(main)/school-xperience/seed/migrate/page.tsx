'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Check, AlertCircle } from 'lucide-react';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

const NEW_SCHOOLS_DATA = [
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

export default function MigrateDataPage() {
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string[]>([]);

  const migrateData = async () => {
    if (!firestore) return;
    setIsLoading(true);
    setResult([]);

    const added: string[] = [];

    for (const school of NEW_SCHOOLS_DATA) {
      try {
        await addDocumentNonBlocking(collection(firestore, 'sx-schools'), {
          ...school,
          pipelineStage: 'Onboarded',
          status: 'Active',
          tier: 'Partner',
          term: 'Term 1',
          academicYear: '2026',
          createdAt: serverTimestamp(),
          createdBy: 'system-migration',
        });
        added.push(`Added: ${school.schoolName}`);
      } catch (error: any) {
        added.push(`Error adding ${school.schoolName}: ${error.message}`);
      }
    }

    setResult(added);
    setIsLoading(false);
  };

  return (
    <div className="container py-8 max-w-2xl">
      <Card className="border-lg shadow-lg">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-6 w-6 text-primary" />
            Migrate New Schools
          </CardTitle>
          <CardDescription>
            Bootstrap the application with the 28 new schools from the application dataset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-bold text-amber-700">Migration Notice</p>
              <p className="text-amber-600">
                This will add 28 schools with placeholder coordinates based on their subcounties. 
                Exact coordinates should be updated during field visits.
              </p>
            </div>
          </div>

          <Button 
            onClick={migrateData} 
            disabled={isLoading} 
            className="w-full btn-omuto h-12 rounded-xl font-black uppercase tracking-widest"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Migrating schools...</>
            ) : (
              <><Plus className="mr-2 h-5 w-5" /> Execute Migration</>
            )}
          </Button>

          {result.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1 max-h-[300px] overflow-y-auto">
              <p className="font-bold text-green-700 flex items-center gap-2">
                <Check className="h-4 w-4" /> Migration Complete!
              </p>
              {result.map((msg, i) => (
                <p key={i} className="text-xs text-green-600">{msg}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
