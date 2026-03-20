'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import {
  MapPin, Search, X, Plus, GraduationCap, Droplets, TreePine, Users,
  Building2, Loader2, Layers, Check, Home, UsersRound, ChevronRight, Info
} from 'lucide-react';
import { InteractiveMap, type MapLocation } from '@/components/school-xperience/interactive-map';
import { GPSLocationPicker } from '@/components/ui/gps-location-picker';
import { UGANDA_LOCATIONS, OMUTO_LOCATIONS, AREA_BOUNDARIES } from '@/lib/uganda-data';

interface SearchResult {
  type: 'omuto_office' | 'youth_center' | 'district' | 'subcounty' | 'parish' | 'village' | 'school';
  name: string;
  description: string;
  details?: {
    address?: string;
    district?: string;
    subcounty?: string;
    parish?: string;
    activities?: string[];
    schools?: number;
    beneficiaries?: number;
    waterSources?: number;
    trees?: number;
    trainings?: number;
  };
  coordinates?: { lat: number; lng: number };
  boundary?: { type: string; coordinates: number[][][] };
}

export default function MapPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'school' | 'water' | 'tree' | 'beneficiary' | 'training'>('school');
  const [mapCenter, setMapCenter] = useState({ lat: 0.208, lng: 32.479 });
  const [mapZoom, setMapZoom] = useState(12);
  const [showBoundary, setShowBoundary] = useState<string | null>(null);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore]);

  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-beneficiaries'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const waterSourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-water-sources'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const treesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-trees'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const trainingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-trainings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: schools } = useCollection<any>(schoolsQuery);
  const { data: beneficiaries } = useCollection<any>(beneficiariesQuery);
  const { data: waterSources } = useCollection<any>(waterSourcesQuery);
  const { data: trees } = useCollection<any>(treesQuery);
  const { data: trainings } = useCollection<any>(trainingsQuery);

  const getSchool = (schoolId: string) => schools?.find(s => s.id === schoolId);

  const allLocations: MapLocation[] = [
    // Omuto HQ
    {
      id: 'omuto-office',
      name: 'Omuto Foundation HQ',
      type: 'training',
      coordinates: OMUTO_LOCATIONS.office.coordinates,
      district: OMUTO_LOCATIONS.office.district,
      subcounty: OMUTO_LOCATIONS.office.subcounty,
      programme: 'HQ',
    },
    // Youth Center
    {
      id: 'youth-center',
      name: 'Omuto Youth Center',
      type: 'training',
      coordinates: OMUTO_LOCATIONS.youthCenter.coordinates,
      district: OMUTO_LOCATIONS.youthCenter.district,
      subcounty: OMUTO_LOCATIONS.youthCenter.subcounty,
      programme: 'Youth',
    },
    ...(schools || []).map(s => ({
      id: s.id,
      name: s.schoolName || 'Unknown',
      type: 'school' as const,
      coordinates: s.coordinates,
      subcounty: s.subCounty,
      district: s.district,
      programme: s.activeProgrammes?.[0],
    })),
    ...(beneficiaries || []).filter(b => b.coordinates).map(b => ({
      id: b.id,
      name: `${b.beneficiaryType} - ${b.programme}`,
      type: 'beneficiary' as const,
      coordinates: b.coordinates,
      subcounty: getSchool(b.schoolId)?.subCounty,
      district: getSchool(b.schoolId)?.district,
      programme: b.programme,
    })),
    ...(waterSources || []).filter(w => w.coordinates).map(w => ({
      id: w.id,
      name: `${w.sourceType} - ${w.status}`,
      type: 'water' as const,
      coordinates: w.coordinates,
      subcounty: getSchool(w.schoolId)?.subCounty,
      district: getSchool(w.schoolId)?.district,
      programme: 'PureWater',
    })),
    ...(trees || []).filter(t => t.coordinates).map(t => ({
      id: t.id,
      name: `${t.quantity} ${t.treeType} trees`,
      type: 'tree' as const,
      coordinates: t.coordinates,
      subcounty: getSchool(t.schoolId)?.subCounty,
      district: getSchool(t.schoolId)?.district,
      programme: 'GreenSchools',
    })),
    ...(trainings || []).filter(t => t.coordinates).map(t => ({
      id: t.id,
      name: `${t.trainingType} - ${t.programme}`,
      type: 'training' as const,
      coordinates: t.coordinates,
      subcounty: getSchool(t.schoolId)?.subCounty,
      district: getSchool(t.schoolId)?.district,
      programme: t.programme,
    })),
  ];

  // Calculate stats per area
  const areaStats = useMemo(() => {
    const stats: Record<string, { schools: number; beneficiaries: number; waterSources: number; trees: number; trainings: number }> = {};
    
    ['Kyebando', 'Kammengo', 'Nabbuzi', 'Mpigi'].forEach(area => {
      const schoolsInArea = (schools || []).filter((s: any) => 
        s.subCounty?.toLowerCase().includes(area.toLowerCase()) ||
        s.district?.toLowerCase().includes(area.toLowerCase()) ||
        s.location?.toLowerCase().includes(area.toLowerCase())
      ).length;
      const beneficiariesInArea = (beneficiaries || []).filter((b: any) => 
        getSchool(b.schoolId)?.subCounty?.toLowerCase().includes(area.toLowerCase())
      ).length;
      const waterInArea = (waterSources || []).filter((w: any) => 
        getSchool(w.schoolId)?.subCounty?.toLowerCase().includes(area.toLowerCase())
      ).length;
      const treesInArea = (trees || []).filter((t: any) => 
        getSchool(t.schoolId)?.subCounty?.toLowerCase().includes(area.toLowerCase())
      ).length;
      const trainingsInArea = (trainings || []).filter((t: any) => 
        getSchool(t.schoolId)?.subCounty?.toLowerCase().includes(area.toLowerCase())
      ).length;
      
      stats[area] = { schools: schoolsInArea, beneficiaries: beneficiariesInArea, waterSources: waterInArea, trees: treesInArea, trainings: trainingsInArea };
    });
    
    return stats;
  }, [schools, beneficiaries, waterSources, trees, trainings]);

  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Check Omuto locations first
    if ('omuto'.includes(query) || 'headquarters'.includes(query) || 'kyebando'.includes(query) || 'kanalukya'.includes(query)) {
      results.push({
        type: 'omuto_office',
        name: OMUTO_LOCATIONS.office.name,
        description: 'Omuto Foundation Headquarters',
        details: {
          address: OMUTO_LOCATIONS.office.address,
          district: OMUTO_LOCATIONS.office.district,
          subcounty: OMUTO_LOCATIONS.office.subcounty,
          activities: ['Administration', 'Staff Coordination', 'Programme Management'],
          ...areaStats['Kyebando'],
        },
        coordinates: OMUTO_LOCATIONS.office.coordinates,
        boundary: AREA_BOUNDARIES['Kyebando'],
      });
    }

    if ('youth'.includes(query) || 'nabbuzi'.includes(query) || 'moka'.includes(query) || 'kammengo'.includes(query)) {
      results.push({
        type: 'youth_center',
        name: OMUTO_LOCATIONS.youthCenter.name,
        description: 'Omuto Youth Center - Skills training hub',
        details: {
          address: OMUTO_LOCATIONS.youthCenter.address,
          district: OMUTO_LOCATIONS.youthCenter.district,
          subcounty: OMUTO_LOCATIONS.youthCenter.subcounty,
          activities: ['Youth Skills Training', 'SLF Programme', 'RED Campaign', 'Career Guidance'],
          ...areaStats['Nabbuzi'],
        },
        coordinates: OMUTO_LOCATIONS.youthCenter.coordinates,
        boundary: AREA_BOUNDARIES['Nabbuzi'],
      });
    }

    // Search UBOS data
    Object.entries(UGANDA_LOCATIONS).forEach(([districtKey, districtData]: [string, any]) => {
      if (districtKey.toLowerCase().includes(query) || districtData.name?.toLowerCase().includes(query)) {
        results.push({
          type: 'district',
          name: districtKey,
          description: `${districtData.subcounties?.length || 0} subcounties, ${districtData.population?.toLocaleString() || 'N/A'} population`,
          coordinates: districtData.coordinates,
        });
      }

      districtData.subcounties?.forEach((sc: any) => {
        if (sc.name.toLowerCase().includes(query) || sc.name.toLowerCase().replace(/\s+/g, '').includes(query.replace(/\s+/g, ''))) {
          const scStats = areaStats[sc.name] || areaStats[Object.keys(areaStats).find(k => sc.name.toLowerCase().includes(k.toLowerCase())) || ''] || { schools: 0, beneficiaries: 0, waterSources: 0, trees: 0, trainings: 0 };
          results.push({
            type: 'subcounty',
            name: sc.name,
            description: `${sc.parishes?.length || 0} parishes`,
            details: { ...scStats },
            coordinates: sc.coordinates,
          });
        }

        sc.parishes?.forEach((p: any) => {
          if (p.name.toLowerCase().includes(query)) {
            results.push({
              type: 'parish',
              name: p.name,
              description: `${p.villages?.length || 0} villages`,
              details: { subcounty: sc.name, district: districtKey },
              coordinates: sc.coordinates,
            });
          }

          p.villages?.forEach((v: string) => {
            if (v.toLowerCase().includes(query)) {
              results.push({
                type: 'village',
                name: v,
                description: 'Village',
                details: { parish: p.name, subcounty: sc.name, district: districtKey },
              });
            }
          });
        });
      });
    });

    // Search schools
    (schools || []).forEach((s: any) => {
      if (
        s.schoolName?.toLowerCase().includes(query) ||
        s.location?.toLowerCase().includes(query) ||
        s.subCounty?.toLowerCase().includes(query)
      ) {
        results.push({
          type: 'school',
          name: s.schoolName,
          description: s.location,
          details: { address: s.location, district: s.district, subcounty: s.subCounty },
          coordinates: s.coordinates,
        });
      }
    });

    return results.slice(0, 15);
  }, [searchQuery, schools, areaStats]);

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.coordinates) {
      setMapCenter(result.coordinates);
      setMapZoom(result.type === 'district' ? 11 : result.type === 'subcounty' ? 13 : 14);
    }
    if (result.boundary) {
      setShowBoundary(result.name);
    }
    setSelectedPlace(result);
    setSearchQuery('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Left Sidebar */}
      <div className="w-96 border-r bg-background flex flex-col overflow-hidden">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="font-black text-lg">Impact Map</h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Kyebando, Kammengo, schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-lg rounded-xl h-11"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedPlace?.name === 'Omuto Foundation HQ' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSearchResultClick({
                type: 'omuto_office',
                name: 'Omuto Foundation HQ',
                description: 'Headquarters',
                coordinates: OMUTO_LOCATIONS.office.coordinates,
                boundary: AREA_BOUNDARIES['Kyebando'],
              })}
              className="h-8 rounded-lg text-xs font-bold"
            >
              <Home className="h-3 w-3 mr-1" />
              Office
            </Button>
            <Button
              variant={selectedPlace?.name === 'Omuto Youth Center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSearchResultClick({
                type: 'youth_center',
                name: 'Omuto Youth Center',
                description: 'Nabbuzi, Kammengo',
                coordinates: OMUTO_LOCATIONS.youthCenter.coordinates,
                boundary: AREA_BOUNDARIES['Nabbuzi'],
              })}
              className="h-8 rounded-lg text-xs font-bold"
            >
              <UsersRound className="h-3 w-3 mr-1" />
              Youth Center
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2 border-b">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {searchResults.length} results
            </p>
            {searchResults.map((result, i) => (
              <button
                key={`${result.type}-${result.name}-${i}`}
                onClick={() => handleSearchResultClick(result)}
                className="w-full text-left p-3 rounded-xl border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={result.type === 'omuto_office' || result.type === 'youth_center' ? 'default' : 'outline'} className="text-xs font-bold">
                    {result.type.replace('_', ' ')}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="font-bold text-sm mt-1">{result.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{result.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* Selected Place Details */}
        {selectedPlace && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Selected Place</p>
              <button onClick={() => { setSelectedPlace(null); setShowBoundary(null); }} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <Badge variant={selectedPlace.type === 'omuto_office' || selectedPlace.type === 'youth_center' ? 'default' : 'outline'}>
                  {selectedPlace.type.replace('_', ' ')}
                </Badge>
                <h3 className="font-black text-xl mt-2">{selectedPlace.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPlace.description}</p>
              </div>

              {selectedPlace.details && (
                <div className="space-y-2">
                  {selectedPlace.details.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>{selectedPlace.details.address}</span>
                    </div>
                  )}
                  {selectedPlace.details.district && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedPlace.details.district} District</span>
                      {selectedPlace.details.subcounty && ` > ${selectedPlace.details.subcounty}`}
                    </div>
                  )}
                  {selectedPlace.details.activities && selectedPlace.details.activities.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Activities</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPlace.details.activities.map(a => (
                          <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Area Stats */}
              {(selectedPlace.details?.schools !== undefined || selectedPlace.details?.beneficiaries !== undefined) && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xl font-black">{selectedPlace.details.schools || 0}</p>
                    <p className="text-xs text-muted-foreground">Schools</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xl font-black">{selectedPlace.details.beneficiaries || 0}</p>
                    <p className="text-xs text-muted-foreground">Beneficiaries</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xl font-black">{selectedPlace.details.waterSources || 0}</p>
                    <p className="text-xs text-muted-foreground">Water Sources</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xl font-black">{selectedPlace.details.trees || 0}</p>
                    <p className="text-xs text-muted-foreground">Trees</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!selectedPlace && searchResults.length === 0 && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Overview</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" /> Schools</span>
                <span className="font-bold">{schools?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-purple-600" /> Beneficiaries</span>
                <span className="font-bold">{beneficiaries?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><Droplets className="h-4 w-4 text-cyan-600" /> Water Sources</span>
                <span className="font-bold">{waterSources?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><TreePine className="h-4 w-4 text-green-600" /> Trees</span>
                <span className="font-bold">{trees?.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-amber-600" /> Trainings</span>
                <span className="font-bold">{trainings?.length || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Add Buttons */}
        <div className="p-4 border-t space-y-2">
          <Button onClick={() => { setAddType('school'); setShowAddModal(true); }} variant="outline" className="w-full justify-start h-10 rounded-lg">
            <GraduationCap className="h-4 w-4 mr-2 text-blue-600" /> Add School
          </Button>
          <Button onClick={() => { setAddType('water'); setShowAddModal(true); }} variant="outline" className="w-full justify-start h-10 rounded-lg">
            <Droplets className="h-4 w-4 mr-2 text-cyan-600" /> Add Water Source
          </Button>
          <Button asChild className="btn-omuto w-full h-10 rounded-lg text-xs font-black uppercase tracking-widest">
            <a href="/school-xperience/log-impact">
              <Plus className="h-4 w-4 mr-2" /> Log Full Impact
            </a>
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 z-0">
          <InteractiveMap
            locations={allLocations}
            center={mapCenter}
            zoom={mapZoom}
            onLocationClick={setSelectedLocation}
          />
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <AddPlaceModal
            type={addType}
            onClose={() => setShowAddModal(false)}
            schools={schools || []}
          />
        )}
      </div>
    </div>
  );
}

function AddPlaceModal({ type, onClose, schools }: {
  type: 'school' | 'water' | 'tree' | 'beneficiary' | 'training';
  onClose: () => void;
  schools: any[];
}) {
  const firestore = useFirestore();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [name, setName] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [sourceType, setSourceType] = useState('borehole');

  const handleSubmit = () => {
    if (!firestore) return;

    if (type === 'school') {
      addDocumentNonBlocking(collection(firestore, 'sx-schools'), {
        schoolName: name,
        location: name,
        coordinates: coordinates || undefined,
        status: 'Registered',
        pipelineStage: 'Inquiry',
        activeProgrammes: [],
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
    } else {
      const school = schools.find(s => s.id === selectedSchoolId);
      const baseData = {
        schoolId: selectedSchoolId,
        schoolName: school?.schoolName || '',
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Staff',
        coordinates: coordinates || undefined,
        createdAt: serverTimestamp(),
        createdBy: 'system',
      };

      if (type === 'water') {
        addDocumentNonBlocking(collection(firestore, 'sx-water-sources'), {
          ...baseData,
          sourceType,
          status: 'functional',
          waterQuality: 'safe',
          estimatedBeneficiaries: 50,
        });
      } else if (type === 'tree') {
        addDocumentNonBlocking(collection(firestore, 'sx-trees'), {
          ...baseData,
          treeType: 'native',
          quantity,
        });
      } else if (type === 'beneficiary') {
        addDocumentNonBlocking(collection(firestore, 'sx-beneficiaries'), {
          ...baseData,
          beneficiaryType: 'student',
          gender: 'female',
          ageGroup: '15_19',
          programme: 'SLF',
          servicesProvided: [],
        });
      } else if (type === 'training') {
        addDocumentNonBlocking(collection(firestore, 'sx-trainings'), {
          ...baseData,
          trainingType: name,
          programme: 'SLF',
          participantsMale: 0,
          participantsFemale: 0,
          topicsCovered: 'General training',
          trainerName: 'Staff',
        });
      }
    }

    window.location.reload();
  };

  const titleMap = { school: 'Add School', water: 'Add Water Source', tree: 'Add Trees', beneficiary: 'Add Beneficiary', training: 'Add Training' };
  const iconMap = { school: GraduationCap, water: Droplets, tree: TreePine, beneficiary: Users, training: Building2 };
  const Icon = iconMap[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-md border-lg shadow-2xl">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              {titleMap[type]}
            </CardTitle>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {type !== 'school' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1">School *</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 font-bold text-sm"
              >
                <option value="">Select school...</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.schoolName}</option>
                ))}
              </select>
            </div>
          )}

          {(type === 'school' || type === 'training') && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1">{type === 'school' ? 'School Name' : 'Training Type'} *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'school' ? 'e.g., St. Mary\'s Primary' : 'e.g., Leadership Training'}
                className="border-lg rounded-xl h-10 font-bold"
              />
            </div>
          )}

          {type === 'tree' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1">Quantity *</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="border-lg rounded-xl h-10 font-bold"
              />
            </div>
          )}

          {type === 'water' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1">Source Type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 font-bold text-sm"
              >
                <option value="borehole">Borehole</option>
                <option value="rainwater_harvest">Rainwater Harvest</option>
                <option value="protected_well">Protected Well</option>
                <option value="spring">Spring</option>
                <option value="pipeline">Pipeline</option>
              </select>
            </div>
          )}

          <GPSLocationPicker
            coordinates={coordinates}
            onCoordinatesChange={setCoordinates}
            label="Location *"
            description="Click to use GPS or enter coordinates"
          />
        </div>
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={type === 'school' ? !name || !coordinates : !selectedSchoolId || !coordinates}
            className="btn-omuto flex-1 h-10 rounded-xl font-black"
          >
            <Check className="mr-1 h-4 w-4" /> Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
