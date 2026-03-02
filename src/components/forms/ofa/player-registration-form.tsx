
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useFirebaseApp, useUser, useCollection } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, UserPlus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/firebase/storage';
import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
// import type { OFATeam, OFAPlayer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
// import { OFAPlayerSchema, OFAPlayerFormData } from '@/lib/types';
import Image from 'next/image';
import { useMemoFirebase } from '@/firebase/provider';

export function PlayerRegistrationForm() {
  return <div>Player registration form coming soon</div>;
}
