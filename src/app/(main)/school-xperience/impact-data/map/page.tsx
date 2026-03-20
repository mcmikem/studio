'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin, Search, X, Plus, GraduationCap, Droplets, TreePine, Users,
  Building2, Eye, EyeOff, Navigation, Loader2, Layers,
  GraduationCap as GradIcon, Heart, Flower2, Check
} from 'lucide-react';
import { InteractiveMap, type MapLocation } from '@/components/school-xperience/interactive-map';
import { GPSLocationPicker } from '@/components/ui/gps-location-picker';
import { UGANDA_LOCATIONS } from '@/lib/uganda-data';

interface SearchResult {
  type: 'district' | 'subcounty' | 'parish' | 'village' | 'school';
  name: string;
  district?: string;
  subcounty?: string;
  parish?: string;
  coordinates?: { lat: number; lng: number };
  description: string;
}

export default function MapPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'school' | 'water' | 'tree' | 'beneficiary' | 'training'>('school');
  const [mapCenter, setMapCenter] = useState({ lat: 0.233, lng: 32.333 });
  const [mapZoom, setMapZoom] = useState(11);

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

  const searchResults: SearchResult[] = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    Object.entries(UGANDA_LOCATIONS).forEach(([districtKey, districtData]: [string, any]) => {
      if (districtKey.toLowerCase().includes(query)) {
        results.push({
          type: 'district',
          name: districtData.name,
          description: `${districtData.subcounties?.length || 0} subcounties, ${districtData.population?.toLocaleString() || 'N/A'} population`,
          coordinates: districtData.center,
        });
      }

      districtData.subcounties?.forEach((sc: any) => {
        if (sc.name.toLowerCase().includes(query)) {
          results.push({
            type: 'subcounty',
            name: sc.name,
            district: districtData.name,
            description: `${sc.parishes?.length || 0} parishes`,
            coordinates: sc.center,
          });
        }

        sc.parishes?.forEach((p: any) => {
          if (p.name.toLowerCase().includes(query)) {
            results.push({
              type: 'parish',
              name: p.name,
              district: districtData.name,
              subcounty: sc.name,
              description: `${p.villages?.length || 0} villages`,
            });
          }

          p.villages?.forEach((v: string) => {
            if (v.toLowerCase().includes(query)) {
              results.push({
                type: 'village',
                name: v,
                district: districtData.name,
                subcounty: sc.name,
                parish: p.name,
                description: 'Village',
              });
            }
          });
        });
      });
    });

    (schools || []).forEach((s: any) => {
      if (
        s.schoolName?.toLowerCase().includes(query) ||
        s.location?.toLowerCase().includes(query) ||
        s.subCounty?.toLowerCase().includes(query) ||
        s.district?.toLowerCase().includes(query)
      ) {
        results.push({
          type: 'school',
          name: s.schoolName,
          district: s.district,
          subcounty: s.subCounty,
          description: s.location,
          coordinates: s.coordinates,
        });
      }
    });

    return results.slice(0, 20);
  }, [searchQuery, schools]);

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.coordinates) {
      setMapCenter(result.coordinates);
      setMapZoom(14);
    } else if (result.type === 'subcounty') {
      const districtData = Object.values(UGANDA_LOCATIONS).find((d: any) => d.name === result.district) as any;
      const subcountyData = districtData?.subcounties?.find((sc: any) => sc.name === result.name);
      if (subcountyData?.center) {
        setMapCenter(subcountyData.center);
        setMapZoom(13);
      }
    }
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MapPin}
        title="Impact Map"
        description="Explore and add schools, water sources, trees, beneficiaries, and training sessions across Uganda."
        breadcrumbs={[
          { name: 'Dashboard', href: '/' },
          { name: 'School Xperience', href: '/school-xperience' },
          { name: 'Map', href: '/school-xperience/impact-data' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="border-lg shadow-comic-sm overflow-hidden">
            <CardContent className="p-0">
              <InteractiveMap
                locations={allLocations}
                center={mapCenter}
                zoom={mapZoom}
                onLocationClick={setSelectedLocation}
                editable={false}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b p-4">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search village, parish, subcounty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-lg rounded-xl h-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {searchResults.map((result, i) => (
                    <button
                      key={`${result.type}-${result.name}-${i}`}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-bold">
                          {result.type}
                        </Badge>
                        <span className="font-bold text-sm truncate">{result.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.district && `${result.district}`}
                        {result.subcounty && ` > ${result.subcounty}`}
                        {result.parish && ` > ${result.parish}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{result.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No results found for "{searchQuery}"
                </p>
              )}

              {!searchQuery && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Quick Stats
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3 text-blue-600" /> Schools</span>
                      <span className="font-bold">{schools?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3 text-purple-600" /> Beneficiaries</span>
                      <span className="font-bold">{beneficiaries?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-cyan-600" /> Water Sources</span>
                      <span className="font-bold">{waterSources?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><TreePine className="h-3 w-3 text-green-600" /> Trees</span>
                      <span className="font-bold">{trees?.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0) || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3 text-amber-600" /> Trainings</span>
                      <span className="font-bold">{trainings?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-lg shadow-comic-sm">
            <CardHeader className="bg-muted/30 border-b p-4">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-10 rounded-lg"
                onClick={() => {
                  setAddType('school');
                  setShowAddModal(true);
                }}
              >
                <GraduationCap className="h-4 w-4 mr-2 text-blue-600" />
                Add School
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-10 rounded-lg"
                onClick={() => {
                  setAddType('water');
                  setShowAddModal(true);
                }}
              >
                <Droplets className="h-4 w-4 mr-2 text-cyan-600" />
                Add Water Source
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-10 rounded-lg"
                onClick={() => {
                  setAddType('tree');
                  setShowAddModal(true);
                }}
              >
                <TreePine className="h-4 w-4 mr-2 text-green-600" />
                Add Trees
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-10 rounded-lg"
                onClick={() => {
                  setAddType('beneficiary');
                  setShowAddModal(true);
                }}
              >
                <Users className="h-4 w-4 mr-2 text-purple-600" />
                Add Beneficiary
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-10 rounded-lg"
                onClick={() => {
                  setAddType('training');
                  setShowAddModal(true);
                }}
              >
                <GraduationCap className="h-4 w-4 mr-2 text-amber-600" />
                Add Training
              </Button>
            </CardContent>
          </Card>

          <Button asChild className="btn-omuto w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest">
            <Link href="/school-xperience/log-impact">
              <Plus className="mr-2 h-4 w-4" />
              Log Full Impact
            </Link>
          </Button>
        </div>
      </div>

      {showAddModal && (
        <AddPlaceModal
          type={addType}
          onClose={() => setShowAddModal(false)}
          schools={schools || []}
          firestore={firestore}
          onSuccess={() => {
            setShowAddModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function AddPlaceModal({ type, onClose, schools, firestore, onSuccess }: {
  type: 'school' | 'water' | 'tree' | 'beneficiary' | 'training';
  onClose: () => void;
  schools: any[];
  firestore: any;
  onSuccess: () => void;
}) {
  const fs = firestore;
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [name, setName] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [sourceType, setSourceType] = useState('borehole');
  const [status, setStatus] = useState('functional');

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
    } else if (type === 'water') {
      addDocumentNonBlocking(collection(firestore, 'sx-water-sources'), {
        schoolId: selectedSchoolId,
        schoolName: schools.find(s => s.id === selectedSchoolId)?.schoolName || '',
        sourceType,
        status,
        waterQuality: 'safe',
        estimatedBeneficiaries: 50,
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Staff',
        coordinates: coordinates || undefined,
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
    } else if (type === 'tree') {
      addDocumentNonBlocking(collection(firestore, 'sx-trees'), {
        schoolId: selectedSchoolId,
        schoolName: schools.find(s => s.id === selectedSchoolId)?.schoolName || '',
        treeType: 'native',
        quantity,
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Staff',
        coordinates: coordinates || undefined,
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
    } else if (type === 'beneficiary') {
      addDocumentNonBlocking(collection(firestore, 'sx-beneficiaries'), {
        schoolId: selectedSchoolId,
        schoolName: schools.find(s => s.id === selectedSchoolId)?.schoolName || '',
        beneficiaryType: 'student',
        gender: 'female',
        ageGroup: '15_19',
        programme: 'SLF',
        servicesProvided: [],
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Staff',
        coordinates: coordinates || undefined,
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
    } else if (type === 'training') {
      addDocumentNonBlocking(collection(firestore, 'sx-trainings'), {
        schoolId: selectedSchoolId,
        schoolName: schools.find(s => s.id === selectedSchoolId)?.schoolName || '',
        trainingType: name,
        programme: 'SLF',
        participantsMale: 0,
        participantsFemale: 0,
        topicsCovered: 'General training',
        date: new Date().toISOString().split('T')[0],
        trainerName: 'Staff',
        coordinates: coordinates || undefined,
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-lg shadow-comic-lg">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              {type === 'school' && <GraduationCap className="h-5 w-5 text-blue-600" />}
              {type === 'water' && <Droplets className="h-5 w-5 text-cyan-600" />}
              {type === 'tree' && <TreePine className="h-5 w-5 text-green-600" />}
              {type === 'beneficiary' && <Users className="h-5 w-5 text-purple-600" />}
              {type === 'training' && <GraduationCap className="h-5 w-5 text-amber-600" />}
              Add {type === 'school' ? 'School' : type === 'water' ? 'Water Source' : type === 'tree' ? 'Trees' : type === 'beneficiary' ? 'Beneficiary' : 'Training'}
            </CardTitle>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {type !== 'school' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest">School</label>
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

          {type === 'school' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest">School Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., St. Mary's Primary School"
                className="border-lg rounded-xl h-10 font-bold"
              />
            </div>
          )}

          {type === 'training' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest">Training Type</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Leadership Training"
                className="border-lg rounded-xl h-10 font-bold"
              />
            </div>
          )}

          {type === 'tree' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="border-lg rounded-xl h-10 font-bold"
              />
            </div>
          )}

          {type === 'water' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest">Source Type</label>
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
            label="Location"
            description="Click to use GPS or enter coordinates"
          />

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl font-bold">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={type === 'school' ? !name || !coordinates : !selectedSchoolId || !coordinates}
              className="btn-omuto flex-1 h-10 rounded-xl font-black"
            >
              <Check className="mr-1 h-4 w-4" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
