'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UGANDA_LOCATIONS, type District } from '@/lib/locations';

export interface LocationPickerProps {
  districtValue?: string;
  subcountyValue?: string;
  parishValue?: string;
  onDistrictChange: (val: string) => void;
  onSubcountyChange: (val: string) => void;
  onParishChange: (val: string) => void;
  disabled?: boolean;
}

export function LocationPicker({
  districtValue,
  subcountyValue,
  parishValue,
  onDistrictChange,
  onSubcountyChange,
  onParishChange,
  disabled = false,
}: LocationPickerProps) {
  const districts = Object.keys(UGANDA_LOCATIONS) as District[];
  
  const subcounties = React.useMemo(() => {
    if (!districtValue || !(districtValue in UGANDA_LOCATIONS)) return [];
    return Object.keys(UGANDA_LOCATIONS[districtValue as District]);
  }, [districtValue]);

  const parishes = React.useMemo(() => {
    if (!districtValue || !subcountyValue || !(districtValue in UGANDA_LOCATIONS)) return [];
    const distData = UGANDA_LOCATIONS[districtValue as District] as Record<string, string[]>;
    if (!(subcountyValue in distData)) return [];
    return distData[subcountyValue];
  }, [districtValue, subcountyValue]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* District */}
      <div className="space-y-2">
        <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">District</Label>
        <Select
          disabled={disabled}
          value={districtValue || undefined}
          onValueChange={(val) => {
            onDistrictChange(val);
            onSubcountyChange(''); // Reset children
            onParishChange('');
          }}
        >
          <SelectTrigger className="h-12 border rounded-xl font-semibold text-omuto-navy px-4">
            <SelectValue placeholder="Select District..." />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
             <SelectItem value="Other">Other...</SelectItem>
          </SelectContent>
        </Select>
      </div>
  
      {/* Subcounty */}
      <div className="space-y-2">
        <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Subcounty</Label>
        <Select
          disabled={disabled || !districtValue || districtValue === 'Other'}
          value={subcountyValue || undefined}
          onValueChange={(val) => {
            onSubcountyChange(val);
            onParishChange(''); // Reset child
          }}
        >
          <SelectTrigger className="h-12 border rounded-xl font-semibold text-omuto-navy px-4">
            <SelectValue placeholder="Select Subcounty..." />
          </SelectTrigger>
          <SelectContent>
            {subcounties.length > 0 ? (
               subcounties.map((s) => (
                 <SelectItem key={s} value={s}>{s}</SelectItem>
               ))
            ) : (
                <SelectItem value="Other" disabled>Select District first</SelectItem>
            )}
             {subcounties.length > 0 && <SelectItem value="Other">Other...</SelectItem>}
          </SelectContent>
        </Select>
      </div>
  
      {/* Parish / Village */}
      <div className="space-y-2">
        <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Parish / Village</Label>
        <Select
          disabled={disabled || !subcountyValue || subcountyValue === 'Other'}
          value={parishValue || undefined}
          onValueChange={onParishChange}
        >
          <SelectTrigger className="h-12 border rounded-xl font-semibold text-omuto-navy px-4">
            <SelectValue placeholder="Select Parish..." />
          </SelectTrigger>
          <SelectContent>
             {parishes.length > 0 ? (
               parishes.map((p) => (
                 <SelectItem key={p} value={p}>{p}</SelectItem>
               ))
             ) : (
                  <SelectItem value="Other" disabled>Select Subcounty first</SelectItem>
             )}
             {parishes.length > 0 && <SelectItem value="Other">Other...</SelectItem>}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
