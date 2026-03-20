'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Layers, Navigation, Loader2 } from 'lucide-react';
import { UGANDA_LOCATIONS } from '@/lib/uganda-data';

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
  const [selectedLayer, setSelectedLayer] = useState<'schools' | 'water' | 'beneficiaries'>('schools');

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import('leaflet')).default;
        
        // Import Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Initialize map centered on Mpigi District
        const map = L.map(mapRef.current!).setView([0.233, 32.333], 10);

        // Add OpenStreetMap tiles (free, no API key)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        // Add markers for schools
        schools.forEach((school) => {
          if (school.coordinates) {
            const marker = L.marker([school.coordinates.lat, school.coordinates.lng])
              .addTo(map)
              .bindPopup(`
                <div class="p-2">
                  <strong>${school.name}</strong>
                  ${school.location ? `<br/><small>${school.location}</small>` : ''}
                  ${school.programme ? `<br/><span class="badge">${school.programme}</span>` : ''}
                </div>
              `);
            
            if (onSchoolClick) {
              marker.on('click', () => onSchoolClick(school));
            }
          }
        });

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
  }, [schools, onSchoolClick]);

  // Update markers when schools change
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
        if (selectedLayer === 'schools') return s.type === 'school';
        if (selectedLayer === 'water') return s.type === 'water';
        if (selectedLayer === 'beneficiaries') return s.type === 'beneficiary';
        return true;
      });

      filteredSchools.forEach((school) => {
        if (school.coordinates) {
          L.marker([school.coordinates.lat, school.coordinates.lng])
            .addTo(map)
            .bindPopup(`
              <div class="p-2">
                <strong>${school.name}</strong>
                ${school.location ? `<br/><small>${school.location}</small>` : ''}
              </div>
            `);
        }
      });
    };

    updateMarkers();
  }, [schools, selectedLayer]);

  return (
    <Card className="border-lg shadow-comic-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-black">Impact Map</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedLayer === 'schools' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('schools')}
              className="h-8 rounded-lg text-xs font-bold"
            >
              <GraduationCap className="mr-1 h-3 w-3" />
              Schools
            </Button>
            <Button
              size="sm"
              variant={selectedLayer === 'water' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('water')}
              className="h-8 rounded-lg text-xs font-bold"
            >
              <Droplets className="mr-1 h-3 w-3" />
              Water
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs mt-1">
          {schools.length} locations mapped in Central Uganda
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[400px] bg-muted/20">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-bold">Loading map...</span>
              </div>
            </div>
          )}
          <div ref={mapRef} className="h-full w-full" />
          
          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-background/95 rounded-xl p-3 border shadow-lg z-[1000]">
            <p className="text-xs font-bold uppercase tracking-widest mb-2">Legend</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs">Partner Schools</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-xs">Water Sources</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-xs">Beneficiaries</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="absolute top-4 right-4 bg-background/95 rounded-xl p-3 border shadow-lg z-[1000]">
            <p className="text-xs font-bold uppercase tracking-widest mb-2">Coverage</p>
            <div className="space-y-1 text-xs">
              <p><span className="font-bold text-blue-600">{schools.filter(s => s.type === 'school').length}</span> schools</p>
              <p><span className="font-bold text-cyan-600">{schools.filter(s => s.type === 'water').length}</span> water points</p>
              <p><span className="font-bold text-pink-600">{schools.filter(s => s.type === 'beneficiary').length}</span> beneficiaries</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Import icons needed for the component
import { GraduationCap, Droplets } from 'lucide-react';
