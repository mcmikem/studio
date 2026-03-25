'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Loader2, Navigation, Plus
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

// Premium SVG icon paths per type
const ICON_SVG: Record<string, string> = {
  school: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  water: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`,
  tree: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 20h5L12 4 2 20h5z"/><path d="M12 20v-3"/></svg>`,
  beneficiary: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  training: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  office: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
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
  const markersRef = useRef<any>(null); // MarkerClusterGroup or array
  const boundaryRef = useRef<any>(null);
  const onLocationClickRef = useRef(onLocationClick);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  onLocationClickRef.current = onLocationClick;
  onCoordinatesChangeRef.current = onCoordinatesChange;
  const [isLoading, setIsLoading] = useState(true);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const dragMarkerRef = useRef<any>(null);

  const getCurrentPosition = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (mapInstanceRef.current) {
          mapInstanceRef.current.map.setView([coords.lat, coords.lng], 16);
        }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Init map — runs once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let isMounted = true;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        
        // Inject Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Inject MarkerCluster CSS
        if (!document.getElementById('leaflet-cluster-css')) {
          const clusterCss = document.createElement('link');
          clusterCss.id = 'leaflet-cluster-css';
          clusterCss.rel = 'stylesheet';
          clusterCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
          document.head.appendChild(clusterCss);

          const clusterDefaultCss = document.createElement('link');
          clusterDefaultCss.id = 'leaflet-cluster-default-css';
          clusterDefaultCss.rel = 'stylesheet';
          clusterDefaultCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
          document.head.appendChild(clusterDefaultCss);
        }

        // Inject MarkerCluster JS
        if (!(window as any).L?.MarkerClusterGroup) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
            script.onload = () => resolve();
            script.onerror = () => reject();
            document.head.appendChild(script);
          });
        }

        // Inject custom cluster styles
        if (!document.getElementById('omuto-cluster-styles')) {
          const style = document.createElement('style');
          style.id = 'omuto-cluster-styles';
          style.textContent = `
            .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
              background: rgba(220, 38, 38, 0.15) !important;
              border: 3px solid rgba(220, 38, 38, 0.4) !important;
            }
            .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
              background: #dc2626 !important;
              color: white !important;
              font-weight: 900 !important;
              font-size: 13px !important;
              font-family: system-ui, -apple-system, sans-serif !important;
            }
            .leaflet-popup-content-wrapper { border-radius: 16px !important; border: 2px solid #001f3f !important; box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important; }
            .leaflet-popup-tip { border-top: 2px solid #001f3f !important; }
            .leaflet-div-icon { background: transparent !important; border: none !important; }
            .omuto-peek-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
            .omuto-peek-tooltip::before { display: none !important; }
            @keyframes ping { 75%, 100% { transform: translate(-50%,-50%) scale(2); opacity: 0; } }
          `;
          document.head.appendChild(style);
        }

        if (!isMounted) return;

        const map = L.map(mapRef.current!, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: false,
        });

        // Premium CartoDB Voyager tiles — clean, modern, high contrast
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Zoom control bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

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
    map.flyTo([center.lat, center.lng], zoom, { duration: 1.2 });
  }, [center.lat, center.lng, zoom]);

  // Setup draggable marker when editable
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
      html: `<div style="background:#dc2626;width:24px;height:24px;border-radius:50%;border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);cursor:move;"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
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

  // Sync draggable marker when coords change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !editable || !dragMarkerRef.current) return;
    if (!clickedCoords) return;
    dragMarkerRef.current.setLatLng([clickedCoords.lat, clickedCoords.lng]);
  }, [clickedCoords, editable]);

  // Update markers with clustering
  useEffect(() => {
    if (!mapInstanceRef.current || isLoading) return;

    const { map, L } = mapInstanceRef.current;

    // Clear existing cluster group
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
      markersRef.current = null;
    }

    // Clear boundary
    if (boundaryRef.current) {
      map.removeLayer(boundaryRef.current);
      boundaryRef.current = null;
    }

    // Add boundary highlight
    if (highlightBoundary && highlightBoundary.coordinates) {
      const coords = highlightBoundary.coordinates[0].map(([lng, lat]) => [lat, lng]);
      boundaryRef.current = L.polygon(coords, {
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '8 4',
      }).addTo(map);
    }

    // Filter locations with coordinates
    const validLocations = locations.filter(loc => loc.coordinates);

    // Create marker cluster group
    const MCG = (window as any).L?.MarkerClusterGroup;
    const clusterGroup = MCG 
      ? new MCG({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          disableClusteringAtZoom: 16,
        })
      : L.layerGroup();

    // Spiderfy collision map for same-coordinate points
    const coordMap = new Map<string, MapLocation[]>();
    validLocations.forEach(loc => {
      const key = `${loc.coordinates!.lat.toFixed(6)},${loc.coordinates!.lng.toFixed(6)}`;
      if (!coordMap.has(key)) coordMap.set(key, []);
      coordMap.get(key)!.push(loc);
    });

    // Add markers
    coordMap.forEach((locs) => {
      const isMultiple = locs.length > 1;
      
      locs.forEach((loc, index) => {
        if (!loc.coordinates) return;

        let lat = loc.coordinates.lat;
        let lng = loc.coordinates.lng;

        // Tiny offset if multiple markers at same coords (within cluster)
        if (isMultiple) {
          const angle = (index / locs.length) * Math.PI * 2;
          const radius = 0.00012;
          lat += Math.cos(angle) * radius;
          lng += Math.sin(angle) * radius;
        }

        const colors = LAYER_COLORS[loc.type] || { marker: '#888' };
        const isSelected = selectedLocation?.id === loc.id;
        const size = loc.type === 'office' ? 28 : 22;
        const iconSvg = ICON_SVG[loc.type] || '<circle cx="12" cy="12" r="8" fill="currentColor" />';

        const icon = L.divIcon({
          className: `omuto-marker ${isSelected ? 'is-selected' : ''}`,
          html: `
            <div style="position:relative;width:${size}px;height:${size}px;">
              ${isSelected ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size+16}px;height:${size+16}px;border:2px solid ${colors.marker};border-radius:50%;opacity:0.4;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
              <div style="background:${colors.marker};width:${size}px;height:${size}px;border-radius:${loc.type === 'office' ? '50%' : '8px'};border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;transition:transform 0.3s;${loc.type === 'office' ? '' : 'transform:rotate(45deg);'}">
                <div style="${loc.type === 'office' ? '' : 'transform:rotate(-45deg);'}display:flex;align-items:center;justify-content:center;width:55%;height:55%;">
                  ${iconSvg}
                </div>
              </div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([lat, lng], { icon });

        // Tooltip
        marker.bindTooltip(`
          <div style="padding:4px 10px;font-family:system-ui;font-weight:800;text-transform:uppercase;font-size:10px;letter-spacing:0.05em;color:white;background:${colors.marker};border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);white-space:nowrap;">
            ${loc.name}
          </div>
        `, {
          permanent: false,
          direction: 'top',
          className: 'omuto-peek-tooltip',
          offset: [0, -size/2 - 4],
          opacity: 1,
        });

        marker.on('click', () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.map.flyTo([lat, lng], Math.max(mapInstanceRef.current.map.getZoom(), 14), { duration: 1 });
          }
          if (onLocationClickRef.current) {
            onLocationClickRef.current(loc);
          }
        });

        clusterGroup.addLayer(marker);
      });
    });

    map.addLayer(clusterGroup);
    markersRef.current = clusterGroup;

  }, [locations, selectedLocation, highlightBoundary, isLoading]);

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />

      {/* Premium Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-white/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white/60" />
              </div>
              <MapPin className="h-4 w-4 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Initializing</p>
              <p className="text-xs font-bold text-white/60 mt-1">Impact Map Engine</p>
            </div>
          </div>
        </div>
      )}

      {/* GPS + Add Controls — Top Right */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <Button
          size="icon"
          onClick={getCurrentPosition}
          disabled={gpsLoading}
          className="h-10 w-10 bg-white text-omuto-navy rounded-xl shadow-lg border border-black/5 hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
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
            className="h-10 w-10 bg-omuto-red text-white rounded-xl shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Re-export helpers for the page
export function MetricRow({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-black/5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-white shadow-sm ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">{label}</span>
      </div>
      <span className="text-sm font-black text-omuto-navy">{value}</span>
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
