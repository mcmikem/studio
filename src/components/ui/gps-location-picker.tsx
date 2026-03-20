'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Navigation, Check, AlertCircle } from 'lucide-react';

interface GPSLocationPickerProps {
  coordinates?: { lat: number; lng: number } | null;
  onCoordinatesChange: (coords: { lat: number; lng: number } | null) => void;
  label?: string;
  description?: string;
}

export function GPSLocationPicker({
  coordinates,
  onCoordinatesChange,
  label = 'GPS Location',
  description = 'Click on the map, use GPS, or enter coordinates manually',
}: GPSLocationPickerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onCoordinatesChange(coords);
        setManualInput(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        setIsGettingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(getErrorMessage(err.code));
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleManualInput = (value: string) => {
    setManualInput(value);
    setError(null);

    const parts = value.replace(',', ' ').trim().split(/\s+/);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onCoordinatesChange({ lat, lng });
        return;
      }
    }
    
    onCoordinatesChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-bold text-xs uppercase tracking-widest">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {coordinates && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
            <Check className="h-3 w-3" />
            Location set
          </span>
        )}
      </div>

      {coordinates && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
          <MapPin className="h-4 w-4 text-green-600" />
          <span className="text-sm font-mono font-bold text-green-700">
            {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex-1 h-10 rounded-xl text-xs font-bold"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting GPS...
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-4 w-4" />
              Use My Location
            </>
          )}
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="font-bold text-xs text-muted-foreground">Or enter manually</Label>
        <Input
          placeholder="e.g., 0.2334, 32.3456"
          value={manualInput}
          onChange={(e) => handleManualInput(e.target.value)}
          className="border-lg rounded-xl h-10 font-mono text-sm"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-700">{error}</p>
        </div>
      )}
    </div>
  );
}

function getErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location permission denied. Please enable location access.';
    case 2:
      return 'Unable to determine location. Please try again.';
    case 3:
      return 'Location request timed out. Please try again.';
    default:
      return 'Unable to get location. Please enter manually.';
  }
}
