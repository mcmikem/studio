'use client';

import { useState, useMemo, useDeferredValue } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFormSubmission } from '@/hooks/use-form-submission';
import {
  MapPin, Search, X, Plus, GraduationCap, Droplets, TreePine, Users,
  Building2, Check, Home, UsersRound, ChevronRight, Sparkles
} from 'lucide-react';
import { InteractiveMap, type MapLocation, MetricRow, LegendItem } from '@/components/school-xperience/interactive-map';
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
    return query(collection(firestore, 'sx-beneficiaries'), orderBy('createdAt', 'desc'), limit(300));
  }, [firestore]);
 
  const waterSourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-water-sources'), orderBy('createdAt', 'desc'), limit(300));
  }, [firestore]);
 
  const treesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-trees'), orderBy('createdAt', 'desc'), limit(300));
  }, [firestore]);
 
  const trainingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-trainings'), orderBy('createdAt', 'desc'), limit(300));
  }, [firestore]);

  const { data: schools } = useCollection<any>(schoolsQuery);
  const { data: beneficiaries } = useCollection<any>(beneficiariesQuery);
  const { data: waterSources } = useCollection<any>(waterSourcesQuery);
  const { data: trees } = useCollection<any>(treesQuery);
  const { data: trainings } = useCollection<any>(trainingsQuery);

  // Calculate area stats
  const areaStats = useMemo(() => {
    const stats: Record<string, { schools: number; beneficiaries: number; waterSources: number; trees: number }> = {};
    const schoolIdsByArea: Record<string, Set<string>> = {};
    
    ['Kyebando', 'Kammengo', 'Nabbuzi', 'Mpigi'].forEach(area => {
      const areaLower = area.toLowerCase();
      const areaSchools = (schools || []).filter((s: any) => 
        s.subCounty?.toLowerCase().includes(areaLower) ||
        s.location?.toLowerCase().includes(areaLower)
      );
      schoolIdsByArea[area] = new Set(areaSchools.map((s: any) => s.id));
      stats[area] = {
        schools: areaSchools.length,
        beneficiaries: (beneficiaries || []).filter((b: any) => schoolIdsByArea[area].has(b.schoolId)).length,
        waterSources: (waterSources || []).filter((w: any) => schoolIdsByArea[area].has(w.schoolId)).length,
        trees: (trees || []).filter((t: any) => schoolIdsByArea[area].has(t.schoolId)).reduce((sum: number, t: any) => sum + (t.quantity || 0), 0),
      };
    });
    
    return stats;
  }, [schools, beneficiaries, waterSources, trees]);

  // Build locations array — Memoized to prevent infinite marker re-renders
  const allLocations = useMemo((): MapLocation[] => [
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
  ], [schools, beneficiaries, waterSources, trees, trainings]);

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
      setMapZoom(result.type === 'district' ? 11 : result.type === 'subcounty' ? 13 : 15);
    }
    if (result.boundary) {
      setShowBoundary(result.boundary);
    }

    // Set selected location for the Insights Sidebar
    setSelectedLocation({
      id: result.id || result.name,
      name: result.name,
      type: result.type,
      district: result.district || (result.type === 'district' ? result.name : ''),
      subcounty: result.subcounty || (result.type === 'subcounty' ? result.name : ''),
      coordinates: result.coordinates,
      description: result.description
    });

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
    <div className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-slate-950">
      {/* Floating Header / Search Deck */}
      <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col md:flex-row gap-4 pointer-events-none">
        <div className="flex-1 max-w-xl pointer-events-auto">
          <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem] p-2 flex items-center gap-3">
             <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20">
                <MapPin className="h-6 w-6" />
             </div>
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input
                  placeholder="Search regions, schools, or beneficiaries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-none bg-transparent h-12 text-sm font-bold focus-visible:ring-0"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
             </div>
             <div className="hidden md:flex items-center gap-2 pr-4 border-l border-black/5 pl-4 ml-2">
                {quickLocations.slice(0, 2).map(loc => (
                  <Button
                    key={loc.name}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (loc.coords) {
                        setMapCenter(loc.coords);
                        setMapZoom(loc.zoom || 12);
                      }
                      if (loc.boundary) setShowBoundary(loc.boundary);
                    }}
                    className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary"
                  >
                    {loc.name}
                  </Button>
                ))}
             </div>
          </Card>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <Card className="mt-3 bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem] overflow-hidden max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-4 border-b border-black/5 bg-muted/30">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Found {searchResults.length} relevant locations
                    </p>
                </div>
                {searchResults.map((result, i) => (
                    <button
                        key={`${result.type}-${result.name}-${i}`}
                        onClick={() => handleSearchClick(result)}
                        className="w-full text-left p-4 hover:bg-primary/5 transition-all flex items-center gap-4 group border-b border-black/5 last:border-0"
                    >
                        <div className={`p-3 rounded-2xl ${result.type === 'office' ? 'bg-primary text-white' : 'bg-muted group-hover:bg-primary/10 group-hover:text-primary'} transition-colors`}>
                            {result.type === 'school' ? <GraduationCap className="h-5 w-5" /> : 
                             result.type === 'office' ? <Home className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-sm text-omuto-navy uppercase truncate">{result.name}</p>
                            <p className="text-xs font-bold text-muted-foreground truncate">{result.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                ))}
            </Card>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pointer-events-auto">
            <Button 
                onClick={() => { setAddType('school'); setShowAddModal(true); }}
                className="h-14 w-14 rounded-full bg-white text-omuto-navy shadow-2xl border-2 border-white/20 hover:scale-110 active:scale-95 transition-all p-0 flex items-center justify-center shrink-0"
                title="Register New School"
              >
                <Plus className="h-6 w-6" />
            </Button>
            <Button 
                asChild
                className="h-14 px-8 rounded-full bg-primary text-white shadow-2xl shadow-primary/20 border-2 border-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"
              >
                <a href="/school-xperience/log-impact">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Log Impact Data</span>
                </a>
            </Button>
        </div>
      </div>

      {/* Floating Insights Sidebar (when selected) */}
      {selectedLocation && (
        <div className="absolute top-24 bottom-6 left-6 z-[1000] w-full max-w-sm pointer-events-none animate-in slide-in-from-left-8 duration-700">
            <Card className="h-full bg-white/90 backdrop-blur-2xl border-white/20 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col pointer-events-auto border-4 border-white/40">
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${selectedLocation.type === 'office' ? 'bg-primary text-white' : 'bg-muted text-primary'} shadow-xl`}>
                            {selectedLocation.type === 'school' ? <GraduationCap className="h-8 w-8" /> : 
                             selectedLocation.type === 'office' ? <Home className="h-8 w-8" /> : <MapPin className="h-8 w-8" />}
                        </div>
                        <div>
                            <Badge className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full font-black text-[9px] uppercase tracking-widest">
                                {selectedLocation.type}
                            </Badge>
                            <h2 className="font-heading text-2xl font-black text-omuto-navy leading-tight tracking-tighter uppercase">{selectedLocation.name}</h2>
                        </div>
                    </div>
                    <button onClick={() => setSelectedLocation(null)} className="p-2 hover:bg-muted rounded-2xl transition-colors">
                        <X className="h-6 w-6 text-muted-foreground/40" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 space-y-8 py-4">
                    {/* Location Context */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-omuto-navy/30">Location Context</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-muted/30 rounded-2xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-omuto-navy/40 mb-1">District</p>
                                <p className="font-bold text-xs text-omuto-navy">{selectedLocation.district || '—'}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-2xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-omuto-navy/40 mb-1">Subcounty</p>
                                <p className="font-bold text-xs text-omuto-navy">{selectedLocation.subcounty || '—'}</p>
                            </div>
                        </div>
                        {selectedLocation.description && (
                            <div className="p-5 bg-primary/5 rounded-2xl border-2 border-primary/5">
                                <p className="text-xs font-bold text-omuto-navy/70 leading-relaxed italic">
                                    "{selectedLocation.description}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-omuto-navy/30">Impact Metrics</p>
                        <div className="space-y-3">
                            <MetricRow 
                                icon={Users} 
                                label="Beneficiaries Captured" 
                                value={selectedLocation.subcounty ? areaStats[selectedLocation.subcounty]?.beneficiaries || 0 : '—'} 
                                color="text-pink-600"
                            />
                            <MetricRow 
                                icon={TreePine} 
                                label="Trees in Region" 
                                value={selectedLocation.subcounty ? areaStats[selectedLocation.subcounty]?.trees || 0 : '—'} 
                                color="text-emerald-600"
                            />
                            <MetricRow 
                                icon={Droplets} 
                                label="Water Sources" 
                                value={selectedLocation.subcounty ? areaStats[selectedLocation.subcounty]?.waterSources || 0 : '—'} 
                                color="text-cyan-600"
                            />
                        </div>
                    </div>

                    {/* Regional Insights if searching subcounty */}
                    {selectedLocation.type === 'subcounty' && (
                        <div className="space-y-4 pt-4 border-t border-black/5">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-omuto-navy/30">Regional Benchmarks</p>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border-2 border-primary/10 bg-primary/5 space-y-1">
                                    <p className="text-[9px] font-black text-primary uppercase">Program Coverage</p>
                                    <p className="text-xl font-black text-omuto-navy italic">84%</p>
                                </div>
                                <div className="p-4 rounded-2xl border-2 border-emerald-500/10 bg-emerald-500/5 space-y-1">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase">Impact Score</p>
                                    <p className="text-xl font-black text-omuto-navy italic">9.2</p>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-black/5 bg-muted/10">
                    <Button className="w-full btn-omuto h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest" asChild>
                        <a href={`/school-xperience/${selectedLocation.id}`}>View Mission Control Profile</a>
                    </Button>
                </div>
            </Card>
        </div>
      )}

      {/* Floating Legend / Export - Bottom Left */}
      <div className="absolute bottom-10 left-10 z-[1000] flex items-end gap-6 pointer-events-none">
        <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem] p-6 pointer-events-auto border-4 border-white/40 hidden md:block">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Interactive Legend</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <LegendItem color="#3b82f6" icon={GraduationCap} label="Schools" />
                <LegendItem color="#06b6d4" icon={Droplets} label="PureWater" />
                <LegendItem color="#22c55e" icon={TreePine} label="GreenSchools" />
                <LegendItem color="#ec4899" icon={Users} label="Beneficiaries" />
                <LegendItem color="#f59e0b" icon={Building2} label="Trainings" />
                <LegendItem color="#dc2626" icon={Home} label="Omuto HQ" />
            </div>
        </Card>

        <Button 
            className="h-16 px-8 rounded-full bg-slate-900/90 text-white backdrop-blur-xl shadow-2xl border-2 border-white/10 hover:bg-slate-900 transition-all gap-4 pointer-events-auto shadow-black/20"
            onClick={() => {/* Implement Image Export */}}
        >
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest">Generate Map Report</span>
        </Button>
      </div>

      <div className="w-full h-full">
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
