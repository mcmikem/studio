'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const scorecardSchema = z.object({
  teamId: z.string().min(1, 'Please select a team.'),
  trainingAttendance: z.number().min(1).max(5),
  coachingQuality: z.number().min(1).max(5),
  playerDiscipline: z.number().min(1).max(5),
  academicAttendance: z.number().min(1).max(5),
  parentEngagement: z.number().min(1).max(5),
  communityReputation: z.number().min(1).max(5),
  achievements: z.string().optional(),
  challenges: z.string().optional(),
  supportNeeded: z.string().optional(),
  month: z.string().min(1, "Month is required."),
});

type ScorecardFormData = z.infer<typeof scorecardSchema>;

export function QuarterlyScorecardForm() {
  return <div>Quarterly scorecard form coming soon</div>;
}
