"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import type { SchoolXperience } from '@/lib/types'
import { Building2 } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'

interface SchoolSelectorProps {
  value: string
  onChange: (schoolId: string, schoolName: string) => void
  label?: string
  error?: string
  placeholder?: string
  excludeSchoolId?: string
}

export function SchoolSelector({
  value,
  onChange,
  label = 'School',
  error,
  placeholder = 'Select school...',
  excludeSchoolId,
}: SchoolSelectorProps) {
  const firestore = useFirestore()

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'))
  }, [firestore])

  const { data: schools, isLoading } = useCollection<SchoolXperience>(schoolsQuery)

  const filteredSchools = useMemo(() => {
    if (!schools) return []
    return schools.filter(s => s.id !== excludeSchoolId)
  }, [schools, excludeSchoolId])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="font-bold text-xs uppercase tracking-widest text-muted-foreground block">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2 h-12 px-3 rounded-xl border border-input bg-muted/30">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-bold">Loading schools...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="font-bold text-xs uppercase tracking-widest text-muted-foreground block">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => {
          const school = filteredSchools.find(s => s.id === e.target.value)
          onChange(e.target.value, school?.schoolName || '')
        }}
        className="w-full h-12 rounded-xl border-lg border-input bg-background px-3 font-bold text-sm"
        aria-label={label}
      >
        <option value="">{placeholder}</option>
        {filteredSchools?.map((s) => (
          <option key={s.id} value={s.id}>{s.schoolName}</option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-destructive font-bold">{error}</p>
      )}
    </div>
  )
}
