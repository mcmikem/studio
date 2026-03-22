'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, GraduationCap, Droplets, Users, Navigation } from 'lucide-react';
import { renderToString } from 'react-dom/server';

interface School {
  id: string;
  name: string;
  location?: string;
  subCounty?: string;
  district?: string;
  coordinates?: { lat: number; lng: number };
  type: 'school' | 'water' | 'beneficiary';
  programme?: string;
}

interface ImpactMapProps {
  schools?: School[];
  selectedDistrict?: string;
  onSchoolClick?: (school: School) => void;
}

export function ImpactMap({ schools = [], selectedDistrict, onSchoolClick }: ImpactMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'schools' | 'water' | 'beneficiaries'>('all');

  // Custom Marker Icons
  const createCustomIcon = (L: any, type: string) => {
    const colors = {
      school: '#3b82f6', // blue-500
      water: '#06b6d4',  // cyan-500
      beneficiary: '#ec4899', // pink-500
    };
    
    const color = colors[type as keyof typeof colors] || colors.school;
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative group">
          <div class="absolute -inset-2 bg-white/20 rounded-full blur-sm group-hover:bg-white/40 transition-all"></div>
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg transform transition-transform group-hover:scale-110" style="background-color: ${color}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              ${type === 'school' ? '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>' : 
                type === 'water' ? '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>' : 
                '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'}
            </svg>
          </div>
          <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-omuto-navy text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">
            ${type.toUpperCase()}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

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

        // Initialize map centered on Mpigi District
        const map = L.map(mapRef.current!, {
          zoomControl: false,
          attributionControl: false
        }).setView([0.233, 32.333], 10);

        // Add custom theme-aware tiles or standard OSM with filter
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

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
  }, []);

  // Update markers when schools or selectedLayer changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Add new markers
      const filteredSchools = schools.filter((s) => {
        if (selectedLayer === 'all') return true;
        if (selectedLayer === 'schools') return s.type === 'school';
        if (selectedLayer === 'water') return s.type === 'water';
        if (selectedLayer === 'beneficiaries') return s.type === 'beneficiary';
        return true;
      });

      filteredSchools.forEach((school) => {
        if (school.coordinates) {
          const marker = L.marker([school.coordinates.lat, school.coordinates.lng], {
            icon: createCustomIcon(L, school.type)
          })
            .addTo(map)
            .bindPopup(`
              <div class="p-3 w-48 font-sans">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-2 h-2 rounded-full" style="background-color: ${school.type === 'school' ? '#3b82f6' : school.type === 'water' ? '#06b6d4' : '#ec4899'}"></div>
                  <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">${school.type}</span>
                </div>
                <h4 class="font-bold text-omuto-navy text-sm leading-tight mb-1">${school.name}</h4>
                <p class="text-[10px] text-omuto-navy/60 mb-2">${school.location || 'Central Uganda'}</p>
                ${school.programme ? `<div class="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full inline-block uppercase tracking-wider">${school.programme}</div>` : ''}
                <hr class="my-3 border-muted/50" />
                <button class="w-full py-1.5 bg-omuto-navy text-white text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-omuto-red transition-colors shadow-sm">
                  View Case Profile
                </button>
              </div>
            `, {
              className: 'custom-popup',
              maxWidth: 240
            });
          
          if (onSchoolClick) {
            marker.on('click', () => onSchoolClick(school));
          }
        }
      });

      // Fit bounds if there are markers
      if (filteredSchools.length > 0) {
        const group = new L.FeatureGroup(filteredSchools.map(s => L.marker([s.coordinates!.lat, s.coordinates!.lng])));
        map.fitBounds(group.getBounds().pad(0.1), { animate: true });
      }
    };

    updateMarkers();
  }, [schools, selectedLayer, onSchoolClick]);

  return (
    <Card className="border-lg shadow-comic-sm overflow-hidden flex flex-col h-[500px]">
      <CardHeader className="bg-white border-b-lg p-4 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tight text-omuto-navy">Impact Pulse</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                {schools.length} Active points across Central Uganda
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={selectedLayer === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('all')}
              className="h-7 rounded-lg text-[9px] font-black uppercase tracking-wider px-3"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={selectedLayer === 'schools' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('schools')}
              className="h-7 rounded-lg text-[9px] font-black uppercase tracking-wider px-3"
            >
              Schools
            </Button>
            <Button
              size="sm"
              variant={selectedLayer === 'water' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('water')}
              className="h-7 rounded-lg text-[9px] font-black uppercase tracking-wider px-3"
            >
              Water
            </Button>
            <Button
              size="sm"
              variant={selectedLayer === 'beneficiaries' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('beneficiaries')}
              className="h-7 rounded-lg text-[9px] font-black uppercase tracking-wider px-3"
            >
              Impact
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative bg-muted/20">
        <style dangerouslySetInnerHTML={{ __html: `
          .leaflet-container { font-family: inherit; background: #f8fafc; }
          .custom-popup .leaflet-popup-content-wrapper { border-radius: 12px; border: 2px solid #001f3f; box-shadow: 4px 4px 0px #001f3f; }
          .custom-popup .leaflet-popup-tip { border: 2px solid #001f3f; }
          .leaflet-div-icon { background: transparent; border: none; }
          .dark .leaflet-layer img { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
        `}} />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[2000] backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <MapPin className="h-4 w-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-omuto-navy">Calibrating Map...</span>
            </div>
          </div>
        )}
        
        <div ref={mapRef} className="h-full w-full z-0" />
        
        {/* Map Legend Overlay */}
        <div className="absolute bottom-6 left-6 bg-white/95 rounded-2xl p-4 border-2 border-omuto-navy shadow-comic-sm z-[1000] hidden sm:block">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-omuto-navy/60 mb-3 underline decoration-omuto-red decoration-2 underline-offset-4">Impact Legend</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
              <span className="text-[10px] font-bold text-omuto-navy">Partner Schools</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-white shadow-sm" />
              <span className="text-[10px] font-bold text-omuto-navy">Water Facilities</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-pink-500 border-2 border-white shadow-sm" />
              <span className="text-[10px] font-bold text-omuto-navy">Direct Beneficiaries</span>
            </div>
          </div>
        </div>

        {/* Floating Quick Action */}
        <div className="absolute top-6 right-6 z-[1000]">
          <Button size="sm" className="h-9 rounded-xl bg-omuto-navy text-white font-black text-[10px] uppercase tracking-widest shadow-comic-sm hover:translate-y-[-2px] transition-transform">
             <Navigation className="h-3 w-3 mr-2" />
             Field View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
