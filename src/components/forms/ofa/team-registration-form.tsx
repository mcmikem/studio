
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowLeft, Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
// import type { OFATeam, User } from '@/lib/types';
import { useEffect } from 'react';
// import { OFATeamSchema, OFATeamFormData } from '@/lib/types';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

export function OFATeamRegistrationForm({ team, onSuccess }: { team?: any | null, onSuccess?: () => void }) {
  return <div>Team registration form coming soon.</div>
}
