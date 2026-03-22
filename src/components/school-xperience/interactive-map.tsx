'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Loader2, GraduationCap, Droplets, TreePine, Users, 
  Building2, Navigation, Home, Crosshair, Plus, X, Layers
} from 'lucide-react';

export interface MapLocation {
  id: string;
  name: string;
  type: 'school' | 'water' | 'tree' | 'beneficiary' | 'training' | 'office';
  coordinates?: { lat: number; lng: number };
  subcounty?: string;
  district?: string;
  parish?: string;
  programme?: string;
  description?: string;
}

interface InteractiveMapProps {
  locations?: MapLocation[];
  onLocationClick?: (location: MapLocation) => void;
  selectedLocation?: MapLocation | null;
  onCoordinatesChange?: (coords: { lat: number; lng: number } | null) => void;
  onMapPlace?: (coords: { lat: number; lng: number }, type: 'school' | 'water' | 'tree' | 'beneficiary' | 'training' | 'office') => void;
  editable?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  highlightBoundary?: { type: string; coordinates: number[][][] } | null;
  className?: string;
}

const LAYER_COLORS: Record<string, { marker: string; fill: string }> = {
  school: { marker: '#3b82f6', fill: 'rgba(59,130,246,0.3)' },
  water: { marker: '#06b6d4', fill: 'rgba(6,182,212,0.3)' },
  tree: { marker: '#22c55e', fill: 'rgba(34,197,94,0.3)' },
  beneficiary: { marker: '#ec4899', fill: 'rgba(236,72,153,0.3)' },
  training: { marker: '#f59e0b', fill: 'rgba(245,158,11,0.3)' },
  office: { marker: '#dc2626', fill: 'rgba(220,38,38,0.3)' },
};

export function InteractiveMap({ 
  locations = [], 
  onLocationClick,
  selectedLocation,
  onCoordinatesChange,
  onMapPlace,
  editable = false,
  center = { lat: 0.208, lng: 32.479 },
  zoom = 12,
  highlightBoundary = null,
  className = '',
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const boundaryRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['school', 'water', 'tree', 'beneficiary', 'training', 'office']));
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const dragMarkerRef = useRef<any>(null);

  // Filter locations
  const filteredLocations = locations.filter(loc => {
    return activeLayers.has(loc.type) && loc.coordinates;
  });

  // Counts
  const counts = {
    school: locations.filter(l => l.type === 'school' && l.coordinates).length,
    water: locations.filter(l => l.type === 'water' && l.coordinates).length,
    tree: locations.filter(l => l.type === 'tree' && l.coordinates).length,
    beneficiary: locations.filter(l => l.type === 'beneficiary' && l.coordinates).length,
    training: locations.filter(l => l.type === 'training' && l.coordinates).length,
    office: locations.filter(l => l.type === 'office' && l.coordinates).length,
  };

  const getCurrentPosition = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentPosition(coords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.map.setView([coords.lat, coords.lng], 16);
        }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

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
        
        // Load Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const map = L.map(mapRef.current!, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add click handler for editable mode
        if (editable) {
          const defaultIcon = L.divIcon({
            className: 'draggable-marker',
            html: `<div style="background:#dc2626;width:20px;height:20px;border-radius:50%;border:4px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:move;display:flex;align-items:center;justify-content:center;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          const startCoords = clickedCoords || { lat: center.lat, lng: center.lng };
          const marker = L.marker([startCoords.lat, startCoords.lng], { 
            icon: defaultIcon, 
            draggable: true 
          }).addTo(map);
          dragMarkerRef.current = marker;

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const coords = { lat: pos.lat, lng: pos.lng };
            setClickedCoords(coords);
            if (onCoordinatesChange) onCoordinatesChange(coords);
          });

          map.on('click', (e: any) => {
            marker.setLatLng([e.latlng.lat, e.latlng.lng]);
            const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
            setClickedCoords(coords);
            if (onCoordinatesChange) onCoordinatesChange(coords);
          });
        }

        mapInstanceRef.current = { map, L };
        setIsLoading(false);
      } catch (error) {
        console.error('Map init error:', error);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update view when center/zoom changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map } = mapInstanceRef.current;
    map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom]);

  // Sync draggable marker with external coord changes (e.g., from GPS button)
  useEffect(() => {
    if (!mapInstanceRef.current || !editable || !dragMarkerRef.current) return;
    if (!clickedCoords) return;
    dragMarkerRef.current.setLatLng([clickedCoords.lat, clickedCoords.lng]);
  }, [clickedCoords, editable]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || isLoading) return;

    const { map, L } = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Clear boundary
    if (boundaryRef.current) {
      map.removeLayer(boundaryRef.current);
      boundaryRef.current = null;
    }

    // Add boundary highlight if exists
    if (highlightBoundary && highlightBoundary.coordinates) {
      const coords = highlightBoundary.coordinates[0].map(([lng, lat]) => [lat, lng]);
      boundaryRef.current = L.polygon(coords, {
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.2,
        weight: 3,
      }).addTo(map);
    }

    // Add markers
    filteredLocations.forEach(loc => {
      if (!loc.coordinates) return;

      const colors = LAYER_COLORS[loc.type] || { marker: '#888' };
      const isSelected = selectedLocation?.id === loc.id;
      const size = isSelected ? 20 : 14;
      const isOmuto = loc.type === 'office';

      const icon = L.divIcon({
        className: `${loc.type}-marker`,
        html: isOmuto 
          ? `<div style="background:${colors.marker};width:${size}px;height:${size}px;border-radius:50%;border:4px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
               <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
             </div>`
          : `<div style="background:${colors.marker};width:${size}px;height:${size}px;border-radius:50%;border:${isSelected ? '4px' : '2px'} solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);${isSelected ? 'transform:scale(1.2);' : ''}"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon }).addTo(map);

      // Popup content
      const typeLabel = loc.type === 'office' ? 'Omuto HQ' : loc.type.charAt(0).toUpperCase() + loc.type.slice(1);
      const popupContent = `
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          <strong style="font-size:14px;">${loc.name}</strong>
          <div style="margin-top:4px;">
            <span style="background:${colors.marker};color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">${typeLabel}</span>
          </div>
          ${loc.subcounty || loc.district ? `<div style="margin-top:6px;font-size:12px;color:#666;">${loc.subcounty || ''}${loc.subcounty && loc.district ? ' • ' : ''}${loc.district || ''}</div>` : ''}
          ${loc.programme ? `<div style="margin-top:4px;font-size:11px;color:#888;">${loc.programme}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onLocationClick) {
          onLocationClick(loc);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (filteredLocations.length > 0 && filteredLocations.some(l => l.coordinates)) {
      const validLocations = filteredLocations.filter(l => l.coordinates);
      if (validLocations.length > 1) {
        const group = L.featureGroup(validLocations.map(l => 
          L.marker([l.coordinates!.lat, l.coordinates!.lng])
        ));
        // Don't auto-fit if we're highlighting a specific boundary
        if (!highlightBoundary) {
          // map.fitBounds(group.getBounds(), { padding: [30, 30] });
        }
      }
    }
  }, [filteredLocations, selectedLocation, highlightBoundary, isLoading, onLocationClick]);

  const totalVisible = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-sm font-bold text-muted-foreground">Loading map...</span>
          </div>
        </div>
      )}

      {/* Layer Controls - Top Right (desktop always visible, mobile toggle) */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        {/* Mobile toggle */}
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="md:hidden bg-white/95 rounded-xl shadow-lg border p-2 flex items-center gap-2 text-xs font-bold"
        >
          <Layers className="h-4 w-4" />
          {showLayers ? 'Hide' : 'Layers'}
        </button>

        {/* Desktop always visible, mobile toggled */}
        <div className={`${showLayers ? 'flex' : 'hidden md:flex'} flex-col gap-2`}>
          {/* Stats */}
          <div className="bg-white/95 rounded-xl p-3 shadow-lg border min-w-[160px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Locations</p>
            <div className="space-y-1.5">
              <LayerRow icon={Home} label="Office" count={counts.office} color="#dc2626" />
              <LayerRow icon={GraduationCap} label="Schools" count={counts.school} color="#3b82f6" />
              <LayerRow icon={Users} label="Beneficiaries" count={counts.beneficiary} color="#ec4899" />
              <LayerRow icon={Droplets} label="Water" count={counts.water} color="#06b6d4" />
              <LayerRow icon={TreePine} label="Trees" count={counts.tree} color="#22c55e" />
              <LayerRow icon={Building2} label="Trainings" count={counts.training} color="#f59e0b" />
            </div>
          </div>

          {/* Layer Toggles */}
          <div className="bg-white/95 rounded-xl p-3 shadow-lg border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Layers</p>
            <div className="space-y-1">
              {(['office', 'school', 'beneficiary', 'water', 'tree', 'training'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => toggleLayer(type)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeLayers.has(type) ? 'bg-muted' : 'opacity-50'
                  }`}
                >
                  <div 
                    className="w-3 h-3 rounded-full border-2" 
                    style={{ 
                      backgroundColor: activeLayers.has(type) ? LAYER_COLORS[type].marker : 'transparent',
                      borderColor: LAYER_COLORS[type].marker 
                    }} 
                  />
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend - Bottom Left (desktop only) */}
      <div className="hidden md:block absolute bottom-4 left-4 z-[1000] bg-white/95 rounded-xl p-3 shadow-lg border">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Legend</p>
        <div className="space-y-1.5">
          <LegendItem color="#dc2626" label="Omuto HQ" />
          <LegendItem color="#3b82f6" label="Partner Schools" />
          <LegendItem color="#ec4899" label="Beneficiaries" />
          <LegendItem color="#06b6d4" label="Water Sources" />
          <LegendItem color="#22c55e" label="Trees Planted" />
          <LegendItem color="#f59e0b" label="Training Sessions" />
        </div>
      </div>

      {/* Quick Add Menu */}
      {editable && clickedCoords && (
        <div className="absolute bottom-16 right-4 z-[1000]">
          {!showAddMenu ? (
            <Button
              size="sm"
              onClick={() => setShowAddMenu(true)}
              className="btn-omuto h-11 w-11 rounded-xl shadow-lg gap-0 p-0"
            >
              <Plus className="h-5 w-5" />
            </Button>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl border-2 p-3 min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Add at {clickedCoords.lat.toFixed(4)}, {clickedCoords.lng.toFixed(4)}
                </p>
                <button onClick={() => setShowAddMenu(false)} className="p-1 rounded hover:bg-muted">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => { onMapPlace?.(clickedCoords, 'school'); setShowAddMenu(false); }} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-blue-50 active:scale-95 transition-all">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                  <span className="text-[10px] font-bold">School</span>
                </button>
                <button onClick={() => { onMapPlace?.(clickedCoords, 'office'); setShowAddMenu(false); }} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-red-50 active:scale-95 transition-all">
                  <Home className="h-6 w-6 text-red-600" />
                  <span className="text-[10px] font-bold">Office</span>
                </button>
                <button onClick={() => { onMapPlace?.(clickedCoords, 'water'); setShowAddMenu(false); }} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-cyan-50 active:scale-95 transition-all">
                  <Droplets className="h-6 w-6 text-cyan-600" />
                  <span className="text-[10px] font-bold">Water</span>
                </button>
                <button onClick={() => { onMapPlace?.(clickedCoords, 'tree'); setShowAddMenu(false); }} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-green-50 active:scale-95 transition-all">
                  <TreePine className="h-6 w-6 text-green-600" />
                  <span className="text-[10px] font-bold">Trees</span>
                </button>
                <button onClick={() => { onMapPlace?.(clickedCoords, 'beneficiary'); setShowAddMenu(false); }} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-pink-50 active:scale-95 transition-all">
                  <Users className="h-6 w-6 text-pink-600" />
                  <span className="text-[10px] font-bold">People</span>
                </button>
                <button onClick={() => { onMapPlace?.(clickedCoords, 'training'); setShowAddMenu(false); }} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-amber-50 active:scale-95 transition-all">
                  <Building2 className="h-6 w-6 text-amber-600" />
                  <span className="text-[10px] font-bold">Training</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GPS / Current Location Button */}
      <button
        onClick={getCurrentPosition}
        disabled={gpsLoading}
        className="absolute top-4 left-4 z-[1000] bg-white/95 rounded-lg px-3 py-2 shadow-lg border hover:bg-muted transition-colors flex items-center gap-2 text-xs font-bold"
        title="Center on my location"
      >
        {gpsLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Crosshair className="h-4 w-4 text-primary" />
        )}
        <span className="hidden sm:inline">My Location</span>
      </button>

      {/* Zoom Info (desktop only - hidden on mobile to reduce clutter) */}
      {!isLoading && (
        <div className="hidden md:block absolute top-4 left-4 z-[1000] bg-white/95 rounded-lg px-3 py-2 shadow-lg border">
          <p className="text-xs text-muted-foreground">
            <MapPin className="inline h-3 w-3 mr-1 text-primary" />
            {totalVisible} locations visible
          </p>
        </div>
      )}
    </div>
  );
}

function LayerRow({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-xs font-bold" style={{ color }}>{count}</span>
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
