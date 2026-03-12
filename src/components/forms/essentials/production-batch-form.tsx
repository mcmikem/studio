'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useUser,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  runTransaction,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  Loader2,
  ArrowLeft,
  Package,
  PlusCircle,
  Trash2,
  Wand2,
  Boxes,
  Pencil,
} from 'lucide-react';
