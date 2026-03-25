'use client';

import { useState, useMemo, useDeferredValue } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { useFormSubmission } from '@/hooks/use-form-submission';
import {
  MapPin, Search, X, Plus, GraduationCap, Droplets, TreePine, Users,
  Building2, Check, Home, ChevronRight, Sparkles, Pencil, Loader2, Eye, EyeOff
} from 'lucide-react';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet';
import { InteractiveMap, type MapLocation, MetricRow } from '@/components/school-xperience/interactive-map';
import { GPSLocationPicker } from '@/components/ui/gps-location-picker';
import { FormShell, FormField, FormGrid, FormSection } from '@/components/ui/form-shell';
import { UGANDA_LOCATIONS, OMUTO_LOCATIONS, AREA_BOUNDARIES } from '@/lib/uganda-data';

// ─── Layer configuration ────────────────────────────────────
const LAYER_CONFIG = {
  school: { icon: GraduationCap, label: 'Schools', color: '#3b82f6', bg: 'bg-blue-500' },
  water: { icon: Droplets, label: 'Water', color: '#06b6d4', bg: 'bg-cyan-500' },
  tree: { icon: TreePine, label: 'Trees', color: '#22c55e', bg: 'bg-emerald-500' },
  beneficiary: { icon: Users, label: 'Impact', color: '#ec4899', bg: 'bg-pink-500' },
  training: { icon: Building2, label: 'Training', color: '#f59e0b', bg: 'bg-amber-500' },
  office: { icon: Home, label: 'HQ', color: '#dc2626', bg: 'bg-red-500' },
} as const;

type LayerType = keyof typeof LAYER_CONFIG;
const ALL_LAYERS: LayerType[] = ['office', 'school', 'beneficiary', 'water', 'tree', 'training'];

export default function MapPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 0.208, lng: 32.479 });
  const [mapZoom, setMapZoom] = useState(12);
  const [showBoundary, setShowBoundary] = useState<{ type: string; coordinates: number[][][] } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<LayerType>('school');
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(ALL_LAYERS));
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<MapLocation | null>(null);
  const [layerBarExpanded, setLayerBarExpanded] = useState(true);

  const handleMapPlace = (coords: { lat: number; lng: number }, type: LayerType) => {
    setMapCoords(coords);
    setAddType(type);
    setShowAddModal(true);
  };

  // ─── Firestore queries ──────────────────────────────────
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

  // ─── Counts ─────────────────────────────────────────────
  const layerCounts = useMemo(() => ({
    school: (schools || []).length,
    water: (waterSources || []).length,
    tree: (trees || []).length,
    beneficiary: (beneficiaries || []).length,
    training: (trainings || []).length,
    office: 2,
  }), [schools, waterSources, trees, beneficiaries, trainings]);

  // ─── Area stats ─────────────────────────────────────────
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

  // ─── Build locations array ──────────────────────────────
  const allLocations = useMemo((): MapLocation[] => [
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
    ...(schools || []).map((s: any) => ({
      id: s.id,
      name: s.schoolName || 'Unknown School',
      type: 'school' as const,
      coordinates: s.coordinates,
      subcounty: s.subCounty,
      district: s.district,
      programme: s.activeProgrammes?.join(', ') || '',
    })),
    ...(beneficiaries || []).filter((b: any) => b.coordinates).map((b: any, i: number) => ({
      id: b.id || `ben-${i}`,
      name: `${b.beneficiaryType} (${b.gender})`,
      type: 'beneficiary' as const,
      coordinates: b.coordinates,
      subcounty: '',
      district: '',
      programme: b.programme,
    })),
    ...(waterSources || []).filter((w: any) => w.coordinates).map((w: any, i: number) => ({
      id: w.id || `water-${i}`,
      name: `${w.sourceType} - ${w.status}`,
      type: 'water' as const,
      coordinates: w.coordinates,
      subcounty: '',
      district: '',
      programme: 'PureWater',
    })),
    ...(trees || []).filter((t: any) => t.coordinates).map((t: any, i: number) => ({
      id: t.id || `tree-${i}`,
      name: `${t.quantity} ${t.treeType} trees`,
      type: 'tree' as const,
      coordinates: t.coordinates,
      subcounty: '',
      district: '',
      programme: 'GreenSchools',
    })),
    ...(trainings || []).filter((t: any) => t.coordinates).map((t: any, i: number) => ({
      id: t.id || `train-${i}`,
      name: t.trainingType || 'Training',
      type: 'training' as const,
      coordinates: t.coordinates,
      subcounty: '',
      district: '',
      programme: t.programme,
    })),
  ], [schools, beneficiaries, waterSources, trees, trainings]);

  // Filter by active layers
  const filteredLocations = useMemo(() => {
    return allLocations.filter(loc => activeLayers.has(loc.type));
  }, [allLocations, activeLayers]);

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  // ─── Search ─────────────────────────────────────────────
  const deferredQuery = useDeferredValue(searchQuery);

  const searchResults = useMemo(() => {
    if (deferredQuery.length < 2) return [];
    const q = deferredQuery.toLowerCase();
    const results: any[] = [];

    // Omuto locations
    if ('omuto'.includes(q) || 'hq'.includes(q) || 'headquarters'.includes(q)) {
      results.push({
        type: 'office', name: 'Omuto Foundation HQ', description: 'Kyebando, Kanalukya Road',
        coordinates: OMUTO_LOCATIONS.office.coordinates, boundary: AREA_BOUNDARIES['Kyebando'],
      });
    }
    if ('youth'.includes(q) || 'nabbuzi'.includes(q) || 'moka'.includes(q)) {
      results.push({
        type: 'office', name: 'Omuto Youth Center', description: 'Nabbuzi, Kammengo',
        coordinates: OMUTO_LOCATIONS.youthCenter.coordinates, boundary: AREA_BOUNDARIES['Nabbuzi'],
      });
    }

    // Districts/Subcounties
    Object.entries(UGANDA_LOCATIONS).forEach(([districtKey, districtData]: [string, any]) => {
      if (districtKey.toLowerCase().includes(q)) {
        results.push({ type: 'district', name: districtKey, description: `${districtData.subcounties?.length || 0} subcounties`, coordinates: districtData.coordinates });
      }
      districtData.subcounties?.forEach((sc: any) => {
        if (sc.name.toLowerCase().includes(q)) {
          results.push({ type: 'subcounty', name: sc.name, description: `${sc.parishes?.length || 0} parishes`, coordinates: sc.coordinates || districtData.coordinates, boundary: AREA_BOUNDARIES[sc.name] });
        }
      });
    });

    // Schools
    (schools || []).forEach((s: any) => {
      if (s.schoolName?.toLowerCase().includes(q) || s.location?.toLowerCase().includes(q)) {
        results.push({ type: 'school', name: s.schoolName, description: s.location, coordinates: s.coordinates });
      }
    });

    return results.slice(0, 8);
  }, [deferredQuery, schools]);

  const handleSearchClick = (result: any) => {
    if (result.coordinates) {
      setMapCenter(result.coordinates);
      setMapZoom(result.type === 'district' ? 11 : result.type === 'subcounty' ? 13 : 15);
    }
    if (result.boundary) setShowBoundary(result.boundary);
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
  };

  // ─── Quick nav ──────────────────────────────────────────
  const quickLocations = [
    { name: 'HQ Office', coords: OMUTO_LOCATIONS.office.coordinates, boundary: AREA_BOUNDARIES['Kyebando'], zoom: 15, icon: Home },
    { name: 'Youth Center', coords: OMUTO_LOCATIONS.youthCenter.coordinates, boundary: AREA_BOUNDARIES['Nabbuzi'], zoom: 15, icon: Building2 },
    { name: 'Mpigi District', coords: UGANDA_LOCATIONS['Mpigi']?.coordinates, zoom: 11, icon: MapPin },
  ];

  const totalPoints = filteredLocations.filter(l => l.coordinates).length;

  return (
    <div className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-slate-950 -mx-2 sm:-mx-4 -my-3 sm:-my-4 lg:-my-6 -mb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] md:-mb-6">
      
      {/* ━━━ Top Search Bar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-3 pointer-events-none">
        <div className="flex-1 max-w-md pointer-events-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-black/5 flex items-center gap-2 px-3 h-12">
            <Search className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            <Input
              placeholder="Search schools, regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none bg-transparent h-full text-sm font-bold focus-visible:ring-0 px-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="mt-2 bg-white/98 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden max-h-[50vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="px-4 py-2.5 border-b border-black/5 bg-muted/20">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  {searchResults.length} results
                </p>
              </div>
              {searchResults.map((result, i) => (
                <button
                  key={`${result.type}-${result.name}-${i}`}
                  onClick={() => handleSearchClick(result)}
                  className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-center gap-3 group border-b border-black/5 last:border-0"
                >
                  <div className={`p-2 rounded-xl ${result.type === 'office' ? 'bg-red-500 text-white' : 'bg-muted group-hover:bg-primary/10 group-hover:text-primary'} transition-colors`}>
                    {result.type === 'school' ? <GraduationCap className="h-4 w-4" /> : 
                     result.type === 'office' ? <Home className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-omuto-navy truncate">{result.name}</p>
                    <p className="text-[10px] font-medium text-muted-foreground truncate">{result.description}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </Card>
          )}
        </div>

        {/* Summary Stats Ribbon */}
        <div className="hidden md:flex items-center gap-1.5 pointer-events-auto">
          {quickLocations.map(loc => {
            const Icon = loc.icon;
            return (
              <Button
                key={loc.name}
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (loc.coords) { setMapCenter(loc.coords); setMapZoom(loc.zoom || 12); }
                  if (loc.boundary) setShowBoundary(loc.boundary);
                }}
                className="h-10 rounded-xl text-[9px] font-bold bg-white shadow-lg border border-black/5 hover:bg-white hover:shadow-xl transition-all gap-1.5"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {loc.name}
              </Button>
            );
          })}
        </div>

        {/* Add + Log Impact buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button 
            onClick={() => { setAddType('school'); setShowAddModal(true); }}
            size="icon"
            className="h-10 w-10 rounded-xl bg-white text-omuto-navy shadow-lg border border-black/5 hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            title="Add Data Point"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            asChild
            size="sm"
            className="h-10 rounded-xl bg-omuto-navy text-white shadow-lg border border-omuto-navy/80 hover:bg-omuto-navy/90 transition-all gap-1.5 hidden sm:flex"
          >
            <a href="/school-xperience/log-impact">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Log Impact</span>
            </a>
          </Button>
        </div>
      </div>

      {/* ━━━ Mobile Detail Sheet ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="lg:hidden">
        <Sheet open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
          <SheetContent side="bottom" className="rounded-t-3xl bg-white border-t-2 border-primary/10 p-0 h-[75vh]">
            {selectedLocation && (
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${selectedLocation.type === 'office' ? 'bg-red-500 text-white' : 'bg-muted text-primary'} shadow-lg`}>
                      {selectedLocation.type === 'school' ? <GraduationCap className="h-7 w-7" /> : 
                       selectedLocation.type === 'office' ? <Home className="h-7 w-7" /> : <MapPin className="h-7 w-7" />}
                    </div>
                    <div>
                      <Badge className="mb-1 bg-primary/10 text-primary border-primary/20 rounded-lg font-bold text-[9px] uppercase tracking-widest px-2 py-0.5">
                        {selectedLocation.type}
                      </Badge>
                      <h2 className="font-bold text-lg text-omuto-navy leading-tight">{selectedLocation.name}</h2>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-omuto-navy/40 mb-1">Region</p>
                      <p className="font-bold text-xs text-omuto-navy">{selectedLocation.subcounty || '—'}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-omuto-navy/40 mb-1">District</p>
                      <p className="font-bold text-xs text-omuto-navy">{selectedLocation.district || '—'}</p>
                    </div>
                  </div>
                  <MetricRow icon={Users} label="Beneficiaries" value={selectedLocation.subcounty ? areaStats[selectedLocation.subcounty]?.beneficiaries || 0 : '—'} color="text-pink-600" />
                  <MetricRow icon={TreePine} label="Trees Planted" value={selectedLocation.subcounty ? areaStats[selectedLocation.subcounty]?.trees || 0 : '—'} color="text-emerald-600" />
                  <MetricRow icon={Droplets} label="Water Sources" value={selectedLocation.subcounty ? areaStats[selectedLocation.subcounty]?.waterSources || 0 : '—'} color="text-cyan-600" />
                </div>
                <div className="pt-4 mt-auto flex gap-2">
                  <Button className="flex-1 btn-omuto h-12 rounded-xl text-[10px] font-bold uppercase tracking-wider" asChild>
                    <a href={`/school-xperience/${selectedLocation.id}`}>View Profile</a>
                  </Button>
                  {selectedLocation.type !== 'district' && selectedLocation.type !== 'subcounty' && (
                    <Button 
                      variant="outline" size="icon"
                      className="h-12 w-12 rounded-xl"
                      onClick={() => { setEditingLocation(selectedLocation); setShowEditModal(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ━━━ Desktop Detail Panel (right side) ━━━━━━━━━━━ */}
      {selectedLocation && (
        <div className="hidden lg:block absolute top-4 bottom-4 right-4 z-[1000] w-[380px] animate-in slide-in-from-right-8 duration-500">
          <Card className="h-full bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-black/5">
            <div className="p-5 flex justify-between items-start border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${selectedLocation.type === 'office' ? 'bg-red-500 text-white' : 'bg-muted text-primary'} shadow-md`}>
                  {selectedLocation.type === 'school' ? <GraduationCap className="h-6 w-6" /> : 
                   selectedLocation.type === 'office' ? <Home className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                </div>
                <div>
                  <Badge className="mb-1 bg-primary/10 text-primary border-primary/20 rounded-lg font-bold text-[9px] uppercase tracking-widest px-2 py-0.5">
                    {selectedLocation.type}
                  </Badge>
                  <h2 className="font-bold text-base text-omuto-navy leading-tight">{selectedLocation.name}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedLocation(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Location Context */}
              <div className="space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-omuto-navy/30">Location</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-omuto-navy/40 mb-0.5">District</p>
                    <p className="font-bold text-xs text-omuto-navy">{selectedLocation.district || '—'}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-omuto-navy/40 mb-0.5">Subcounty</p>
                    <p className="font-bold text-xs text-omuto-navy">{selectedLocation.subcounty || '—'}</p>
                  </div>
                </div>
                {selectedLocation.description && (
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/5">
                    <p className="text-xs font-medium text-omuto-navy/70 leading-relaxed">{selectedLocation.description}</p>
                  </div>
                )}
              </div>

              {/* Impact Metrics */}
              <div className="space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-omuto-navy/30">Impact Metrics</p>
                <div className="space-y-2">
                  <MetricRow icon={Users} label="Beneficiaries" value={selectedLocation.subcounty ? areaStats[selectedLocation.subcounty]?.beneficiaries || 0 : '—'} color="text-pink-600" />
                  <MetricRow icon={TreePine} label="Trees" value={selectedLocation.subcounty ? areaStats[selectedLocation.subcounty]?.trees || 0 : '—'} color="text-emerald-600" />
                  <MetricRow icon={Droplets} label="Water Sources" value={selectedLocation.subcounty ? areaStats[selectedLocation.subcounty]?.waterSources || 0 : '—'} color="text-cyan-600" />
                </div>
              </div>

              {/* Area stats for subcounty searches */}
              {selectedLocation.type === 'subcounty' && selectedLocation.subcounty && (
                <div className="space-y-3 pt-3 border-t border-black/5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-omuto-navy/30">Area Overview</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl border border-primary/10 bg-primary/5">
                      <p className="text-[8px] font-bold text-primary uppercase">Schools</p>
                      <p className="text-lg font-black text-omuto-navy">{areaStats[selectedLocation.subcounty]?.schools || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl border border-emerald-500/10 bg-emerald-50">
                      <p className="text-[8px] font-bold text-emerald-600 uppercase">Beneficiaries</p>
                      <p className="text-lg font-black text-omuto-navy">{areaStats[selectedLocation.subcounty]?.beneficiaries || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-black/5 bg-muted/10 space-y-2">
              <Button className="w-full btn-omuto h-11 rounded-xl text-[10px] font-bold uppercase tracking-wider" asChild>
                <a href={`/school-xperience/${selectedLocation.id}`}>View Full Profile</a>
              </Button>
              {selectedLocation.type !== 'district' && selectedLocation.type !== 'subcounty' && (
                <Button 
                  variant="outline"
                  className="w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                  onClick={() => { setEditingLocation(selectedLocation); setShowEditModal(true); }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Coordinates
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ━━━ Bottom Layer Pill Bar ━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-black/5 flex items-center gap-1 p-1.5 transition-all">
          {/* Toggle collapse button */}
          <button
            onClick={() => setLayerBarExpanded(!layerBarExpanded)}
            className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors shrink-0"
            title={layerBarExpanded ? 'Collapse layers' : 'Expand layers'}
          >
            {layerBarExpanded ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>

          {layerBarExpanded && (
            <>
              {ALL_LAYERS.map(type => {
                const config = LAYER_CONFIG[type];
                const Icon = config.icon;
                const isActive = activeLayers.has(type);
                const count = layerCounts[type];

                return (
                  <button
                    key={type}
                    onClick={() => toggleLayer(type)}
                    className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-white shadow-sm border border-black/5 text-omuto-navy' 
                        : 'text-muted-foreground/50 hover:text-muted-foreground'
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-md flex items-center justify-center ${isActive ? config.bg : 'bg-muted/60'} text-white transition-colors`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <span className="hidden sm:inline">{config.label}</span>
                    <span className={`text-[10px] font-black tabular-nums ${isActive ? '' : 'opacity-50'}`}>{count}</span>
                  </button>
                );
              })}
              
              {/* Total badge */}
              <div className="h-9 px-3 rounded-xl bg-omuto-navy text-white flex items-center gap-1.5 ml-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold tabular-nums">{totalPoints}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ━━━ Map ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-full h-full">
        <InteractiveMap
          locations={filteredLocations}
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

        {/* Edit Modal */}
        {showEditModal && editingLocation && (
          <EditPlaceModal
            location={editingLocation}
            onClose={() => { setShowEditModal(false); setEditingLocation(null); }}
            onSave={(coords: { lat: number; lng: number }) => {
              setMapCenter(coords);
              setMapZoom(16);
              setShowEditModal(false);
              setEditingLocation(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Add Place Modal ────────────────────────────────────────
function AddPlaceModal({ type, onClose, schools, initialCoordinates }: { type: string; onClose: () => void; schools: any[]; initialCoordinates?: { lat: number; lng: number } | null }) {
  const { submit, isSubmitting } = useFormSubmission();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(initialCoordinates || null);
  const [name, setName] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitted || isSubmitting) return;
    setError(null);
    try {
      const school = schools.find((s: any) => s.id === selectedSchoolId);
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

      if (result?.error) {
        setError('Failed to save. Check your connection and try again.');
      } else {
        setSubmitted(true);
        onClose();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const icons: Record<string, any> = { school: GraduationCap, water: Droplets, tree: TreePine, beneficiary: Users, training: Building2, office: Home };
  const Icon = icons[type] || Building2;
  const canSubmit = !isSubmitting && !submitted && (type === 'school' ? (name && coordinates) : (selectedSchoolId && coordinates));

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[2000] p-0 sm:p-4">
      <Card className="w-full max-w-lg border shadow-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-xl text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-omuto-navy">Add {type}</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-omuto-navy/40">New Impact Point</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="h-5 w-5 text-omuto-navy/40" /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <FormShell onSubmit={handleSubmit} className="space-y-6">
            {type !== 'school' && (
              <FormField>
                <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 text-omuto-navy/60">Select School *</label>
                <select 
                  value={selectedSchoolId} 
                  onChange={e => setSelectedSchoolId(e.target.value)} 
                  className="w-full h-12 rounded-xl border border-black/10 px-4 font-bold text-sm text-omuto-navy bg-white focus:border-primary/30 outline-none transition-all"
                >
                  <option value="">Select...</option>
                  {schools.map((s: any) => <option key={s.id} value={s.id}>{s.schoolName}</option>)}
                </select>
              </FormField>
            )}

            {(type === 'school' || type === 'training') && (
              <FormField>
                <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 text-omuto-navy/60">{type === 'school' ? 'School Name' : 'Training Type'} *</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={type === 'school' ? "St. Mary's Primary" : "Leadership Training"} className="rounded-xl h-12 border font-bold text-sm text-omuto-navy bg-white" />
              </FormField>
            )}

            {type === 'tree' && (
              <FormField>
                <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 text-omuto-navy/60">Quantity</label>
                <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="rounded-xl h-12 border font-bold text-sm text-omuto-navy bg-white" />
              </FormField>
            )}

            <FormSection title="Location" className="pt-2">
              <GPSLocationPicker 
                coordinates={coordinates} 
                onCoordinatesChange={setCoordinates} 
                label="Geotag Point" 
                description="Tap map or use GPS to set location" 
              />
            </FormSection>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-bold">
                {error}
              </div>
            )}
          </FormShell>
        </div>

        <div className="p-4 bg-muted/30 border-t flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="btn-omuto flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-wider">
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Check className="h-4 w-4 mr-2" /> Save Point</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Edit Place Modal ───────────────────────────────────────
function EditPlaceModal({ location, onClose, onSave }: { location: MapLocation; onClose: () => void; onSave: (coords: { lat: number; lng: number }) => void }) {
  const firestore = useFirestore();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>(
    location.coordinates || { lat: 0, lng: 0 }
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (saved || isSaving || !firestore) return;
    setError(null);
    setIsSaving(true);
    try {
      const collectionMap: Record<string, string> = {
        school: 'sx-schools', water: 'sx-water-sources', tree: 'sx-trees',
        beneficiary: 'sx-beneficiaries', training: 'sx-trainings', office: 'sx-locations',
      };
      const colName = collectionMap[location.type] || 'sx-schools';
      const docRef = doc(firestore, colName, location.id);
      updateDocumentNonBlocking(docRef, { coordinates });
      setSaved(true);
      onSave(coordinates);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[2000] p-0 sm:p-4">
      <Card className="w-full max-w-lg border shadow-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-xl text-white">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-omuto-navy">Adjust Location</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-omuto-navy/40">Correcting GPS Data</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="h-5 w-5 text-omuto-navy/40" /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="text-[9px] font-bold uppercase tracking-widest text-primary/60 mb-0.5">Editing</p>
            <p className="font-bold text-sm text-omuto-navy">{location.name}</p>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{location.type} {location.district ? `· ${location.district}` : ''}</p>
          </div>

          <FormShell onSubmit={handleSave} className="space-y-6">
            <FormGrid columns={2}>
              <FormField>
                <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 text-omuto-navy/60">Latitude</label>
                <Input
                  type="number" step="0.000001" value={coordinates.lat}
                  onChange={e => setCoordinates(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                  className="rounded-xl h-12 border font-bold text-sm text-omuto-navy bg-white tabular-nums"
                />
              </FormField>
              <FormField>
                <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 text-omuto-navy/60">Longitude</label>
                <Input
                  type="number" step="0.000001" value={coordinates.lng}
                  onChange={e => setCoordinates(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                  className="rounded-xl h-12 border font-bold text-sm text-omuto-navy bg-white tabular-nums"
                />
              </FormField>
            </FormGrid>

            <FormSection title="Visual Correction" className="pt-2">
              <GPSLocationPicker 
                coordinates={coordinates} 
                onCoordinatesChange={(coords) => { if (coords) setCoordinates(coords); }} 
                label="Reposition Pin" 
                description="Drag the marker to the exact location" 
              />
            </FormSection>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-bold">{error}</div>
            )}
          </FormShell>
        </div>

        <div className="p-4 bg-muted/30 border-t flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
          <Button onClick={handleSave} disabled={saved || isSaving} className="btn-omuto flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-wider">
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check className="h-4 w-4 mr-2" /> Updated</>
            ) : (
              <><Check className="h-4 w-4 mr-2" /> Save Coordinates</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
