'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Check, AlertCircle } from 'lucide-react';

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
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    if (coordinates) {
      setManualInput(`${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`);
    } else {
      setManualInput('');
    }
  }, [coordinates]);

  const getCurrentLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setError(null);
    setAccuracy(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const acc = position.coords.accuracy;
        setAccuracy(acc);
        onCoordinatesChange(coords);
        setManualInput(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        setIsGettingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(getErrorMessage(err.code));
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000,
      }
    );
  }, [onCoordinatesChange]);

  const handleManualInput = useCallback((value: string) => {
    setManualInput(value);
    setError(null);

    const parts = value.replace(',', ' ').trim().split(/\s+/);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      
      const isValidUganda = lat >= -1 && lat <= 4 && lng >= 29 && lng <= 35;
      const isValidGlobal = lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      
      if (!isNaN(lat) && !isNaN(lng) && (isValidUganda || isValidGlobal)) {
        onCoordinatesChange({ lat, lng });
        return;
      }
    }
    
    onCoordinatesChange(null);
  }, [onCoordinatesChange]);

  const clearLocation = useCallback(() => {
    setManualInput('');
    setAccuracy(null);
    onCoordinatesChange(null);
  }, [onCoordinatesChange]);

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
            {accuracy ? `±${Math.round(accuracy)}m` : 'Location set'}
          </span>
        )}
      </div>

      {coordinates && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
          <MapPin className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-sm font-mono font-bold text-green-700">
            {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
          </span>
          {accuracy && (
            <span className={`text-xs font-bold ml-auto ${
              accuracy < 10 ? 'text-green-600' :
              accuracy < 50 ? 'text-amber-600' :
              'text-red-600'
            }`}>
              ±{Math.round(accuracy)}m
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex-1 h-11 rounded-xl text-xs font-bold"
          aria-label="Use my current GPS location"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Acquiring signal...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Use My Location
            </>
          )}
        </Button>
        {coordinates && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearLocation}
            className="h-11 rounded-xl text-xs font-bold border-red-200 text-red-500 hover:bg-red-50"
            aria-label="Clear location"
          >
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <Label className="font-bold text-xs text-muted-foreground">Or enter manually</Label>
        <Input
          inputMode="decimal"
          placeholder="0.23345, 32.34567"
          value={manualInput}
          onChange={(e) => handleManualInput(e.target.value)}
          className="border-lg rounded-xl h-10 font-mono text-sm"
          aria-label="Manual coordinate input"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200" role="alert">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}
    </div>
  );
}

function getErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location denied. Please allow location access in your browser settings.';
    case 2:
      return 'Unable to determine location. Stand outdoors and try again.';
    case 3:
      return 'Location request timed out. Try again or enter coordinates manually.';
    default:
      return 'Unable to get location. Please enter coordinates manually.';
  }
}
