'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, Loader2, GraduationCap, Droplets, TreePine, Users, 
  Building2, Navigation, Home, Crosshair, Plus, X, Layers, Sparkles, MessageSquare, Search
} from 'lucide-react';

export interface MapLocation {
  id: string;
  name: string;
  type: 'school' | 'water' | 'tree' | 'beneficiary' | 'training' | 'office' | 'district' | 'subcounty';
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
  const onLocationClickRef = useRef(onLocationClick);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  onLocationClickRef.current = onLocationClick;
  onCoordinatesChangeRef.current = onCoordinatesChange;
  const [isLoading, setIsLoading] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['school', 'water', 'tree', 'beneficiary', 'training', 'office']));
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
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
  // Init map — runs once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!isMounted) return;

        const map = L.map(mapRef.current!, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = { map, L };
        setIsLoading(false);
      } catch (error) {
        console.error('Map init error:', error);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update view when center/zoom changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map } = mapInstanceRef.current;
    map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom]);

  // Setup draggable marker when editable changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map, L } = mapInstanceRef.current;

    if (dragMarkerRef.current) {
      map.removeLayer(dragMarkerRef.current);
      dragMarkerRef.current = null;
    }

    if (!editable) return;

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
      if (onCoordinatesChangeRef.current) onCoordinatesChangeRef.current(coords);
    });

    map.on('click', (e: any) => {
      marker.setLatLng([e.latlng.lat, e.latlng.lng]);
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setClickedCoords(coords);
      if (onCoordinatesChangeRef.current) onCoordinatesChangeRef.current(coords);
    });
  }, [editable, center.lat, center.lng]);

  // Sync draggable marker when coords change externally (GPS button)
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

    // Coordinates collision map for spiderfying
    const coordMap = new Map<string, MapLocation[]>();
    filteredLocations.forEach(loc => {
      if (!loc.coordinates) return;
      const key = `${loc.coordinates.lat.toFixed(6)},${loc.coordinates.lng.toFixed(6)}`;
      if (!coordMap.has(key)) coordMap.set(key, []);
      coordMap.get(key)!.push(loc);
    });

    // Add markers
    coordMap.forEach((locs, key) => {
      const isMultiple = locs.length > 1;
      
      locs.forEach((loc, index) => {
        if (!loc.coordinates) return;

        let lat = loc.coordinates.lat;
        let lng = loc.coordinates.lng;

        // Apply spiderfy offset if multiple
        if (isMultiple) {
          const angle = (index / locs.length) * Math.PI * 2;
          const radius = 0.00015; // Jitter radius
          lat += Math.cos(angle) * radius;
          lng += Math.sin(angle) * radius;
        }

        const colors = LAYER_COLORS[loc.type] || { marker: '#888' };
        const isSelected = selectedLocation?.id === loc.id;
        const size = isSelected ? 32 : 24;
        
        // Premium SVG Icons
        const getIconHtml = (type: string) => {
            switch(type) {
                case 'school': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
                case 'water': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;
                case 'tree': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 20h5L12 4 2 20h5z"/><path d="M12 20v-3"/></svg>`;
                case 'beneficiary': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
                case 'training': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
                case 'office': return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
                default: return `<circle cx="12" cy="12" r="10" />`;
            }
        };

        const icon = L.divIcon({
          className: `omuto-marker-premium marker-${loc.type} ${isSelected ? 'is-selected' : ''}`,
          html: `
            <div class="marker-wrapper" style="position:relative; width:${size}px; height:${size}px;">
              ${isSelected ? `<div class="selection-ring" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size+20}px;height:${size+20}px;border:3px solid ${colors.marker};border-radius:50%;opacity:0.3;animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
              <div class="marker-body" style="background:${colors.marker};width:${size}px;height:${size}px;border-radius:12px;border:3px solid white;box-shadow:0 8px 16px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);transform:rotate(45deg);">
                <div style="transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;width:60%;height:60%;">
                    ${getIconHtml(loc.type)}
                </div>
              </div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);

        // Hover Peek Tooltip
        const peekContent = `
            <div class="peek-tooltip" style="padding:4px 8px;font-family:system-ui;font-weight:900;text-transform:uppercase;font-size:10px;letter-spacing:0.05em;color:white;background:${colors.marker};border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);white-space:nowrap;">
                ${loc.name}
            </div>
        `;

        marker.bindTooltip(peekContent, {
            permanent: false,
            direction: 'top',
            className: 'omuto-peek-tooltip',
            offset: [0, -size/2],
            opacity: 0.9,
            sticky: true
        });

        marker.on('click', () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.map.flyTo([lat, lng], 15, { duration: 1.5 });
            }
            if (onLocationClickRef.current) {
                onLocationClickRef.current(loc);
            }
        });

        markersRef.current.push(marker);
      });
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
  }, [filteredLocations, selectedLocation, highlightBoundary, isLoading]);

  const totalVisible = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className={`relative group/map ${className}`}>
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

      {/* Modern GPS Control - Top Right */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button
                size="icon"
                onClick={getCurrentPosition}
                disabled={gpsLoading}
                className="h-10 w-10 bg-white/90 backdrop-blur text-primary rounded-xl shadow-lg border border-white/20 hover:bg-white hover:scale-110 active:scale-95 transition-all"
            >
                {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            </Button>
            {editable && (
                <Button
                    size="icon"
                    onClick={() => {
                        if (mapInstanceRef.current) {
                            const center = mapInstanceRef.current.map.getCenter();
                            onMapPlace?.({ lat: center.lat, lng: center.lng }, 'school');
                        }
                    }}
                    className="h-10 w-10 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            )}
      </div>
    </div>
  );
}

function LayerRow({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between group/row">
      <div className="flex items-center gap-2">
        <div className="p-1 px-1.5 rounded-md bg-muted group-hover/row:bg-primary/10 transition-colors">
            <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] font-bold text-omuto-navy/70 group-hover/row:text-omuto-navy transition-colors">{label}</span>
      </div>
      <span className="text-[10px] font-black" style={{ color }}>{count}</span>
    </div>
  );
}

export function LegendItem({ color, label, icon: Icon }: { color: string; label: string; icon: any }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-black/5" style={{ backgroundColor: color }}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/60">{label}</span>
    </div>
  );
}

export function MetricRow({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
    return (
        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-black/5">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white shadow-sm ${color}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">{label}</span>
            </div>
            <span className="text-sm font-black text-omuto-navy italic">{value}</span>
        </div>
    )
}
