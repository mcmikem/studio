'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Layers, Navigation, Loader2, Search, X, 
  GraduationCap, Droplets, TreePine, Users, Building2,
  Eye, EyeOff
} from 'lucide-react';
import { UGANDA_LOCATIONS } from '@/lib/uganda-data';

export interface MapLocation {
  id: string;
  name: string;
  type: 'school' | 'water' | 'tree' | 'beneficiary' | 'training';
  coordinates?: { lat: number; lng: number };
  subcounty?: string;
  district?: string;
  parish?: string;
  programme?: string;
  data?: any;
}

interface InteractiveMapProps {
  locations?: MapLocation[];
  onLocationClick?: (location: MapLocation) => void;
  selectedLocation?: MapLocation | null;
  onCoordinatesChange?: (coords: { lat: number; lng: number } | null) => void;
  editable?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const LAYER_COLORS = {
  school: { marker: '#3b82f6', fill: '#3b82f6' }, // blue
  water: { marker: '#06b6d4', fill: '#06b6d4' },   // cyan
  tree: { marker: '#22c55e', fill: '#22c55e' },    // green
  beneficiary: { marker: '#ec4899', fill: '#ec4899' }, // pink
  training: { marker: '#f59e0b', fill: '#f59e0b' }, // amber
};

export function InteractiveMap({ 
  locations = [], 
  onLocationClick,
  selectedLocation,
  onCoordinatesChange,
  editable = false,
  center = { lat: 0.233, lng: 32.333 },
  zoom = 11
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['school', 'water', 'tree']));
  const [searchQuery, setSearchQuery] = useState('');
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showSubcountyLabels, setShowSubcountyLabels] = useState(true);
  const clickMarkerRef = useRef<any>(null);

  // Filter locations based on active layers and search
  const filteredLocations = locations.filter(loc => {
    if (!activeLayers.has(loc.type)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        loc.name.toLowerCase().includes(query) ||
        loc.subcounty?.toLowerCase().includes(query) ||
        loc.district?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Count by type
  const counts = {
    school: locations.filter(l => l.type === 'school').length,
    water: locations.filter(l => l.type === 'water').length,
    tree: locations.filter(l => l.type === 'tree').length,
    beneficiary: locations.filter(l => l.type === 'beneficiary').length,
    training: locations.filter(l => l.type === 'training').length,
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        
        // Import Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const map = L.map(mapRef.current!).setView([center.lat, center.lng], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        // Click handler for editable mode
        if (editable) {
          map.on('click', (e: any) => {
            const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
            setClickedCoords(coords);
            if (onCoordinatesChange) {
              onCoordinatesChange(coords);
            }
            
            // Add/update click marker
            if (clickMarkerRef.current) {
              map.removeLayer(clickMarkerRef.current);
            }
            clickMarkerRef.current = L.marker([coords.lat, coords.lng], {
              icon: L.divIcon({
                className: 'click-marker',
                html: `<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })
            }).addTo(map).bindPopup(`Selected: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
          });
        }

        mapInstanceRef.current = map;
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [editable, center.lat, center.lng, zoom]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach(marker => map.removeLayer(marker));
      markersRef.current = [];

      // Add markers for filtered locations
      filteredLocations.forEach(loc => {
        if (!loc.coordinates) return;
        
        const colors = LAYER_COLORS[loc.type] || { marker: '#888' };
        
        const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], {
          icon: L.divIcon({
            className: `${loc.type}-marker`,
            html: `<div style="background:${colors.marker};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width:150px">
            <strong>${loc.name}</strong>
            <br/>
            <small style="color:#666">${loc.type}${loc.subcounty ? ` • ${loc.subcounty}` : ''}</small>
            ${loc.programme ? `<br/><span style="background:${colors.marker};color:white;padding:1px 4px;border-radius:3px;font-size:10px">${loc.programme}</span>` : ''}
          </div>
        `);

        marker.on('click', () => {
          if (onLocationClick) {
            onLocationClick(loc);
          }
        });

        markersRef.current.push(marker);
      });
    };

    updateMarkers();
  }, [filteredLocations, onLocationClick]);

  return (
    <Card className="border-lg shadow-comic-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-black">Impact Map</CardTitle>
          </div>
          
          {/* Layer toggles */}
          <div className="flex flex-wrap gap-2">
            {(['school', 'water', 'tree', 'beneficiary', 'training'] as const).map(type => (
              <Button
                key={type}
                size="sm"
                variant={activeLayers.has(type) ? 'default' : 'outline'}
                onClick={() => toggleLayer(type)}
                className="h-8 rounded-lg text-xs font-bold gap-1"
              >
                {activeLayers.has(type) ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {counts[type]}
                {type === 'school' && <GraduationCap className="h-3 w-3" />}
                {type === 'water' && <Droplets className="h-3 w-3" />}
                {type === 'tree' && <TreePine className="h-3 w-3" />}
                {type === 'beneficiary' && <Users className="h-3 w-3" />}
                {type === 'training' && <Building2 className="h-3 w-3" />}
              </Button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schools, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-lg text-sm"
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
          <Button
            variant={showSubcountyLabels ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowSubcountyLabels(!showSubcountyLabels)}
            className="h-9 rounded-lg text-xs font-bold"
          >
            Subcounties
          </Button>
        </div>

        {editable && clickedCoords && (
          <div className="mt-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs font-bold text-primary">
              Selected: {clickedCoords.lat.toFixed(6)}, {clickedCoords.lng.toFixed(6)}
            </p>
          </div>
        )}

        <CardDescription className="text-xs mt-1">
          {filteredLocations.length} locations visible • Click map to select coordinates
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative h-[500px] bg-muted/20">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-bold">Loading map...</span>
              </div>
            </div>
          )}
          <div ref={mapRef} className="h-full w-full" />
          
          {/* Stats overlay */}
          <div className="absolute top-4 right-4 bg-background/95 rounded-xl p-3 border shadow-lg z-[1000] max-w-[180px]">
            <p className="text-xs font-bold uppercase tracking-widest mb-2">Coverage</p>
            <div className="space-y-1.5">
              <LayerStat icon={GraduationCap} label="Schools" count={counts.school} color="text-blue-600" />
              <LayerStat icon={Droplets} label="Water Points" count={counts.water} color="text-cyan-600" />
              <LayerStat icon={TreePine} label="Trees" count={counts.tree} color="text-green-600" />
              <LayerStat icon={Users} label="Beneficiaries" count={counts.beneficiary} color="text-pink-600" />
              <LayerStat icon={Building2} label="Trainings" count={counts.training} color="text-amber-600" />
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/95 rounded-xl p-3 border shadow-lg z-[1000]">
            <p className="text-xs font-bold uppercase tracking-widest mb-2">Legend</p>
            <div className="space-y-1">
              <LegendItem color="#3b82f6" label="Partner Schools" />
              <LegendItem color="#06b6d4" label="Water Sources" />
              <LegendItem color="#22c55e" label="Trees Planted" />
              <LegendItem color="#ec4899" label="Beneficiaries" />
              <LegendItem color="#f59e0b" label="Training Sessions" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LayerStat({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${color}`} />
        <span className="text-xs">{label}</span>
      </div>
      <span className={`text-xs font-bold ${color}`}>{count}</span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs">{label}</span>
    </div>
  );
}
