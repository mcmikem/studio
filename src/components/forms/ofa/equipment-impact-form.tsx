'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import type { OFATeam } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const impactTrackerSchema = z.object({
  teamId: z.string().min(1, 'Please select a team.'),
  item: z.string().min(2, 'Item name is required.'),
  dateGiven: z.string().min(1, 'Date given is required.'),
  beforeSupport: z.string().optional(),
  thirtyDays: z.string().optional(),
  sixtyDays: z.string().optional(),
  ninetyDays: z.string().optional(),
  realImpact: z.string().optional(),
});

type ImpactTrackerFormData = z.infer<typeof impactTrackerSchema>;

export function OFAEquipmentImpactForm() {
  return <div>OFA Equipment Impact form coming soon</div>;
}
