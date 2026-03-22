'use client';

import { useState, useMemo, useDeferredValue } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFormSubmission } from '@/hooks/use-form-submission';
import {
  MapPin, Search, X, Plus, GraduationCap, Droplets, TreePine, Users,
  Building2, Check, Home, UsersRound, ChevronRight
} from 'lucide-react';
import { InteractiveMap, type MapLocation } from '@/components/school-xperience/interactive-map';
import { GPSLocationPicker } from '@/components/ui/gps-location-picker';
import { UGANDA_LOCATIONS, OMUTO_LOCATIONS, AREA_BOUNDARIES } from '@/lib/uganda-data';

export default function MapPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 0.208, lng: 32.479 });
  const [mapZoom, setMapZoom] = useState(12);
  const [showBoundary, setShowBoundary] = useState<{ type: string; coordinates: number[][][] } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'school' | 'water' | 'tree' | 'beneficiary' | 'training' | 'office'>('school');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapPlace = (coords: { lat: number; lng: number }, type: 'school' | 'water' | 'tree' | 'beneficiary' | 'training' | 'office') => {
    setMapCoords(coords);
    setAddType(type);
    setShowAddModal(true);
  };

  // Fetch data
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

  // Calculate area stats
  const areaStats = useMemo(() => {
    const stats: Record<string, { schools: number; beneficiaries: number; waterSources: number; trees: number }> = {};
    
    ['Kyebando', 'Kammengo', 'Nabbuzi', 'Mpigi'].forEach(area => {
      const areaLower = area.toLowerCase();
      stats[area] = {
        schools: (schools || []).filter((s: any) => 
          s.subCounty?.toLowerCase().includes(areaLower) ||
          s.location?.toLowerCase().includes(areaLower)
        ).length,
        beneficiaries: (beneficiaries || []).length,
        waterSources: (waterSources || []).length,
        trees: (trees || []).reduce((sum: number, t: any) => sum + (t.quantity || 0), 0),
      };
    });
    
    return stats;
  }, [schools, beneficiaries, waterSources, trees]);

  // Build locations array
  const allLocations: MapLocation[] = [
    // Omuto HQ
    {
      id: 'omuto-office',
      name: 'Omuto Foundation HQ',
      type: 'office',
      coordinates: OMUTO_LOCATIONS.office.coordinates,
      district: OMUTO_LOCATIONS.office.district,
      subcounty: OMUTO_LOCATIONS.office.subcounty,
      programme: 'Administration',
      description: 'Headquarters - Kyebando, Kanalukya Road',
    },
    // Youth Center
    {
      id: 'youth-center',
      name: 'Omuto Youth Center',
      type: 'office',
      coordinates: OMUTO_LOCATIONS.youthCenter.coordinates,
      district: OMUTO_LOCATIONS.youthCenter.district,
      subcounty: OMUTO_LOCATIONS.youthCenter.subcounty,
      programme: 'Youth Programmes',
      description: 'Nabbuzi, Kammengo - near Moka Petrol Station',
    },
    // Schools
    ...(schools || []).map(s => ({
      id: s.id,
      name: s.schoolName || 'Unknown School',
      type: 'school' as const,
      coordinates: s.coordinates,
      subcounty: s.subCounty,
      district: s.district,
      programme: s.activeProgrammes?.join(', ') || '',
    })),
    // Beneficiaries
    ...(beneficiaries || []).filter(b => b.coordinates).map((b, i) => ({
      id: b.id || `ben-${i}`,
      name: `${b.beneficiaryType} (${b.gender})`,
      type: 'beneficiary' as const,
      coordinates: b.coordinates,
      subcounty: '',
      district: '',
      programme: b.programme,
    })),
    // Water Sources
    ...(waterSources || []).filter(w => w.coordinates).map((w, i) => ({
      id: w.id || `water-${i}`,
      name: `${w.sourceType} - ${w.status}`,
      type: 'water' as const,
      coordinates: w.coordinates,
      subcounty: '',
      district: '',
      programme: 'PureWater',
    })),
    // Trees
    ...(trees || []).filter(t => t.coordinates).map((t, i) => ({
      id: t.id || `tree-${i}`,
      name: `${t.quantity} ${t.treeType} trees`,
      type: 'tree' as const,
      coordinates: t.coordinates,
      subcounty: '',
      district: '',
      programme: 'GreenSchools',
    })),
    // Trainings
    ...(trainings || []).filter(t => t.coordinates).map((t, i) => ({
      id: t.id || `train-${i}`,
      name: t.trainingType || 'Training',
      type: 'training' as const,
      coordinates: t.coordinates,
      subcounty: '',
      district: '',
      programme: t.programme,
    })),
  ];

  // Debounce search to avoid jank on slow devices
  const deferredQuery = useDeferredValue(searchQuery);

  // Search results
  const searchResults = useMemo(() => {
    if (deferredQuery.length < 2) return [];
    const query = deferredQuery.toLowerCase();
    const results: any[] = [];

    // Omuto locations
    if ('omuto'.includes(query) || 'hq'.includes(query) || 'headquarters'.includes(query)) {
      results.push({
        type: 'office',
        name: 'Omuto Foundation HQ',
        description: 'Kyebando, Kanalukya Road',
        details: { address: 'Kyebando, Kanalukya Road, Wakiso', activities: ['Administration', 'Staff Coordination', 'Programme Management'] },
        coordinates: OMUTO_LOCATIONS.office.coordinates,
        boundary: AREA_BOUNDARIES['Kyebando'],
      });
    }

    if ('youth'.includes(query) || 'nabbuzi'.includes(query) || 'moka'.includes(query)) {
      results.push({
        type: 'office',
        name: 'Omuto Youth Center',
        description: 'Nabbuzi, Kammengo',
        details: { address: 'Nabbuzi, Kammengo Subcounty, Mpigi', activities: ['Youth Skills Training', 'SLF Programme', 'RED Campaign'] },
        coordinates: OMUTO_LOCATIONS.youthCenter.coordinates,
        boundary: AREA_BOUNDARIES['Nabbuzi'],
      });
    }

    // Districts/Subcounties
    Object.entries(UGANDA_LOCATIONS).forEach(([districtKey, districtData]: [string, any]) => {
      if (districtKey.toLowerCase().includes(query)) {
        results.push({
          type: 'district',
          name: districtKey,
          description: `${districtData.subcounties?.length || 0} subcounties`,
          coordinates: districtData.coordinates,
        });
      }

      districtData.subcounties?.forEach((sc: any) => {
        if (sc.name.toLowerCase().includes(query)) {
          results.push({
            type: 'subcounty',
            name: sc.name,
            description: `${sc.parishes?.length || 0} parishes`,
            coordinates: sc.coordinates || districtData.coordinates,
            boundary: AREA_BOUNDARIES[sc.name],
          });
        }
      });
    });

    // Schools
    (schools || []).forEach((s: any) => {
      if (s.schoolName?.toLowerCase().includes(query) || s.location?.toLowerCase().includes(query)) {
        results.push({
          type: 'school',
          name: s.schoolName,
          description: s.location,
          coordinates: s.coordinates,
        });
      }
    });

    return results.slice(0, 10);
  }, [deferredQuery, schools]);

  // Handle search result click
  const handleSearchClick = (result: any) => {
    if (result.coordinates) {
      setMapCenter(result.coordinates);
      setMapZoom(result.type === 'district' ? 11 : result.type === 'subcounty' ? 13 : 14);
    }
    if (result.boundary) {
      setShowBoundary(result.boundary);
    }
    setSearchQuery('');
    setShowMobileSidebar(false);
  };

  // Quick location buttons
  const quickLocations = [
    { name: 'Office', coords: OMUTO_LOCATIONS.office.coordinates, boundary: AREA_BOUNDARIES['Kyebando'], zoom: 15 },
    { name: 'Youth Center', coords: OMUTO_LOCATIONS.youthCenter.coordinates, boundary: AREA_BOUNDARIES['Nabbuzi'], zoom: 15 },
    { name: 'Mpigi', coords: UGANDA_LOCATIONS['Mpigi']?.coordinates, zoom: 11 },
    { name: 'Kammengo', coords: { lat: 0.0897, lng: 32.2456 }, zoom: 13 },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-8rem)] overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="m-2 h-9 rounded-lg text-xs font-bold shadow-sm"
        >
          <MapPin className="h-4 w-4 mr-1" />
          {showMobileSidebar ? 'Hide' : 'Show'} Panel ({schools?.length || 0} schools)
        </Button>
      </div>

      {/* Left Sidebar */}
      <div className={`w-full lg:w-96 border-r bg-background flex flex-col overflow-y-auto overflow-x-hidden shrink-0 ${showMobileSidebar ? 'flex' : 'hidden lg:flex'}`}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="font-black text-xl">Impact Map</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Kyebando, schools, subcounties..."
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

          {/* Quick Location Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {quickLocations.map(loc => (
              <button
                key={loc.name}
                onClick={() => {
                  if (loc.coords) {
                    setMapCenter(loc.coords);
                    setMapZoom(loc.zoom || 12);
                  }
                  if (loc.boundary) setShowBoundary(loc.boundary);
                }}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-muted transition-colors"
              >
                {loc.name === 'Office' && <Home className="inline h-3 w-3 mr-1" />}
                {loc.name === 'Youth Center' && <UsersRound className="inline h-3 w-3 mr-1" />}
                {loc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4 border-b max-h-64">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
              {searchResults.length} results
            </p>
            {searchResults.map((result, i) => (
              <button
                key={`${result.type}-${result.name}-${i}`}
                onClick={() => handleSearchClick(result)}
                className="w-full text-left p-3 rounded-xl border hover:bg-muted/50 transition-colors mb-2"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={result.type === 'office' ? 'default' : 'outline'} className="text-xs font-bold">
                    {result.type}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="font-bold text-sm mt-1">{result.name}</p>
                <p className="text-xs text-muted-foreground">{result.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* Selected Location Details */}
        {selectedLocation && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selected</p>
              <button onClick={() => setSelectedLocation(null)} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Badge variant={selectedLocation.type === 'office' ? 'default' : 'outline'} className="font-bold">
                  {selectedLocation.type}
                </Badge>
                <h3 className="font-black text-lg mt-2">{selectedLocation.name}</h3>
                {selectedLocation.description && (
                  <p className="text-sm text-muted-foreground">{selectedLocation.description}</p>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                {selectedLocation.district && (
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {selectedLocation.district} District
                    {selectedLocation.subcounty && ` > ${selectedLocation.subcounty}`}
                  </p>
                )}
                {selectedLocation.coordinates && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <MapPin className="h-3 w-3" />
                    {selectedLocation.coordinates.lat.toFixed(5)}, {selectedLocation.coordinates.lng.toFixed(5)}
                  </p>
                )}
                {selectedLocation.programme && (
                  <p className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {selectedLocation.programme}
                  </p>
                )}
              </div>

              {/* Area Stats */}
              {selectedLocation.type === 'school' || selectedLocation.type === 'beneficiary' || selectedLocation.type === 'office' ? (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-lg font-black">
                        {selectedLocation.subcounty
                          ? (schools || []).filter((s: any) => s.subCounty === selectedLocation.subcounty).length
                          : (schools || []).filter((s: any) => s.district === selectedLocation.district).length}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Schools Here</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-lg font-black">
                        {selectedLocation.subcounty
                          ? beneficiaries?.filter((b: any) => {
                              const school = (schools || []).find((s: any) => s.id === b.schoolId);
                              return school?.subCounty === selectedLocation.subcounty;
                            }).length || 0
                          : beneficiaries?.filter((b: any) => {
                              const school = (schools || []).find((s: any) => s.id === b.schoolId);
                              return school?.district === selectedLocation.district;
                            }).length || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Beneficiaries</p>
                    </div>
                  </div>

                  {/* Subcounty breakdown if in a district */}
                  {selectedLocation.district && (() => {
                    const districtKey = selectedLocation.district as keyof typeof UGANDA_LOCATIONS;
                    const districtData = UGANDA_LOCATIONS[districtKey];
                    if (!districtData?.subcounties) return null;
                    const districtSchools = (schools || []).filter((s: any) => s.district === selectedLocation.district);
                    return (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Schools by Subcounty</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {districtData.subcounties.map((sc: any) => {
                            const count = districtSchools.filter((s: any) => s.subCounty === sc.name).length;
                            return (
                              <div key={sc.name} className="flex items-center justify-between p-1.5 rounded-lg bg-muted/30">
                                <span className="text-xs font-bold truncate flex-1 mr-2">{sc.name}</span>
                                <span className={`text-xs font-black ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-black">{schools?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Schools</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-black">{beneficiaries?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Beneficiaries</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Overview (when no selection) */}
        {!selectedLocation && searchResults.length === 0 && (
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Overview</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" /> Schools</span>
                <span className="font-bold">{schools?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-pink-600" /> Beneficiaries</span>
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

            {/* Schools needing coordinates */}
            {(() => {
              const needsCoords = (schools || []).filter((s: any) => !s.coordinates);
              if (needsCoords.length === 0) return null;
              return (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {needsCoords.length} Schools Need GPS
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {needsCoords.slice(0, 10).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                        <span className="font-bold truncate flex-1 mr-2">{s.schoolName}</span>
                        <span className="text-amber-600 whitespace-nowrap">{s.subCounty || s.location || '—'}</span>
                      </div>
                    ))}
                    {needsCoords.length > 10 && (
                      <p className="text-[10px] text-center text-muted-foreground">+{needsCoords.length - 10} more</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Add Buttons */}
        <div className="p-4 border-t space-y-2 bg-muted/20">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => { setAddType('school'); setShowAddModal(true); }} variant="outline" className="h-10 rounded-lg text-xs font-bold">
              <GraduationCap className="h-4 w-4 mr-1" /> School
            </Button>
            <Button onClick={() => { setAddType('water'); setShowAddModal(true); }} variant="outline" className="h-10 rounded-lg text-xs font-bold">
              <Droplets className="h-4 w-4 mr-1" /> Water
            </Button>
          </div>
          <Button asChild className="btn-omuto w-full h-10 rounded-lg text-xs font-black uppercase tracking-widest">
            <a href="/school-xperience/log-impact">
              <Plus className="h-4 w-4 mr-1" /> Log Impact
            </a>
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-[50vh] lg:min-h-0">
        <InteractiveMap
          locations={allLocations}
          center={mapCenter}
          zoom={mapZoom}
          highlightBoundary={showBoundary}
          onLocationClick={setSelectedLocation}
          onMapPlace={handleMapPlace}
          editable={true}
        />

        {/* Add Modal */}
        {showAddModal && (
          <AddPlaceModal
            type={addType}
            onClose={() => { setShowAddModal(false); setMapCoords(null); }}
            schools={schools || []}
            initialCoordinates={mapCoords}
          />
        )}
      </div>
    </div>
  );
}

function AddPlaceModal({ type, onClose, schools, initialCoordinates }: { type: string; onClose: () => void; schools: any[]; initialCoordinates?: { lat: number; lng: number } | null }) {
  const { submit, isSubmitting } = useFormSubmission();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(initialCoordinates || null);
  const [name, setName] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitted || isSubmitting) return;
    setError(null);
    try {
      const school = schools.find(s => s.id === selectedSchoolId);
      const idempotencyKey = `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const baseData = {
        schoolId: selectedSchoolId,
        schoolName: school?.schoolName || '',
        date: new Date().toISOString().split('T')[0],
        coordinates: coordinates || undefined,
      };

      let result;
      if (type === 'school') {
        result = await submit({ collectionName: 'sx-schools', idempotencyKey, data: { schoolName: name, location: name, coordinates: coordinates || undefined, status: 'Registered', pipelineStage: 'Inquiry', activeProgrammes: [] } });
      } else if (type === 'water') {
        result = await submit({ collectionName: 'sx-water-sources', idempotencyKey, data: { ...baseData, sourceType: 'borehole', status: 'functional', waterQuality: 'safe', estimatedBeneficiaries: 50 } });
      } else if (type === 'tree') {
        result = await submit({ collectionName: 'sx-trees', idempotencyKey, data: { ...baseData, treeType: 'native', quantity } });
      } else if (type === 'beneficiary') {
        result = await submit({ collectionName: 'sx-beneficiaries', idempotencyKey, data: { ...baseData, beneficiaryType: 'student', gender: 'female', ageGroup: '15_19', programme: 'SLF', servicesProvided: [] } });
      } else if (type === 'training') {
        result = await submit({ collectionName: 'sx-trainings', idempotencyKey, data: { ...baseData, trainingType: name, programme: 'SLF', participantsMale: 0, participantsFemale: 0, topicsCovered: 'General', trainerName: 'Staff' } });
      } else {
        result = await submit({ collectionName: 'sx-locations', idempotencyKey, data: { name: name || 'New Office', locationType: 'office', coordinates: coordinates || undefined } });
      }

      if (result?.isOffline || result?.isQueued) {
        setSubmitted(true);
        onClose();
      } else if (result?.error) {
        setError('Failed to save. Check your connection and try again.');
      } else {
        setSubmitted(true);
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const icons: Record<string, any> = { school: GraduationCap, water: Droplets, tree: TreePine, beneficiary: Users, training: Building2, office: Home };
  const Icon = icons[type] || Building2;
  const canSubmit = submitted || isSubmitting || (type === 'school' ? !name || !coordinates : !selectedSchoolId || !coordinates);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-md border-2 shadow-2xl">
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              Add {type.charAt(0).toUpperCase() + type.slice(1)}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
          </div>

          {type !== 'school' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1">School *</label>
              <select value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} className="w-full h-10 rounded-xl border px-3 font-bold">
                <option value="">Select...</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.schoolName}</option>)}
              </select>
            </div>
          )}

          {(type === 'school' || type === 'training') && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1">{type === 'school' ? 'School Name' : 'Training Type'} *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={type === 'school' ? "St. Mary's Primary" : "Leadership Training"} className="border-lg rounded-xl h-10 font-bold" />
            </div>
          )}

          {type === 'tree' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1">Quantity</label>
              <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="border-lg rounded-xl h-10 font-bold" />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
              {error}
            </div>
          )}

          <GPSLocationPicker coordinates={coordinates} onCoordinatesChange={setCoordinates} label="Location" description="Tap map to pin, drag marker, or enter manually" />
        </div>

        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl font-bold">Cancel</Button>
          <Button onClick={handleSubmit} disabled={canSubmit} className="btn-omuto flex-1 h-10 rounded-xl font-black">
            <Check className="h-4 w-4 mr-1" /> {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
