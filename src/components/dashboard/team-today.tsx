
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

// This component is being simplified as the "check-in" concept is removed.
// It can be repurposed later if a new "who's active" feature is needed.

export function TeamToday() {
  const teamMembers = [
    { id: '1', name: 'McMike Mutumba', status: 'Active' },
    { id: '2', name: 'Dianah Nansikombi', status: 'Active' },
    { id: '3', name: 'Kasirye Constantine', status: 'Active' },
    { id: '4', name: 'Nsereko Alex', status: 'In Office' },
    { id: '5', name: 'Bwire Bashir', status: 'In Field' },
  ];
  
  const isLoading = false; // Mocking loading state

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Directory
        </CardTitle>
        <CardDescription>A quick look at the core team.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-3 w-3 rounded-full mt-1" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))
          : teamMembers.map((member) => (
              <div key={member.id} className="flex items-start gap-3">
                <UserCheck
                  className={`flex h-4 w-4 flex-shrink-0 text-green-500 mt-0.5`}
                />
                <p className="font-semibold">{member.name}</p>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}
