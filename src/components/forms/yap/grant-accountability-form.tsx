'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Loader2, ArrowLeft, FileUp, PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SeedGrantApplication } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const accountabilitySchema = z.object({
  grantId: z.string().min(1, 'Please select the grant.'),
  totalSpent: z.coerce.number().min(1, 'Total amount spent is required.'),
  receiptUrls: z.array(z.object({ value: z.string().url("Must be a valid URL.") })).min(1, 'At least one receipt link is required.'),
  outputDescription: z.string().min(10, 'Please describe the outputs.'),
});

type AccountabilityFormData = z.infer<typeof accountabilitySchema>;

export function GrantAccountabilityForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const grantsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'seed-grant-applications'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: grants, isLoading: isLoadingGrants } = useCollection<SeedGrantApplication>(grantsQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AccountabilityFormData>({
    resolver: zodResolver(accountabilitySchema),
    defaultValues: {
      receiptUrls: [{ value: '' }],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "receiptUrls" });

  const onSubmit = async (data: AccountabilityFormData) => {
    if (!firestore) return;
    const formData = { 
        ...data,
        receiptUrls: data.receiptUrls.map(item => item.value),
        createdAt: serverTimestamp()
    };
    try {
      await addDocumentNonBlocking(collection(firestore, 'seed-grant-accountability'), formData);
      toast({
        title: 'Accountability Submitted!',
        description: `The accountability report has been successfully submitted.`,
      });
      reset();
      router.push('/meal/yap');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/meal/yap">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to YAP Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-6 w-6" />
            Seed Grant Accountability
          </CardTitle>
          <CardDescription>
            Submit accountability reports for received seed grants.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="grantId">Select Grant</Label>
              {isLoadingGrants ? <Skeleton className="h-10" /> : (
                <Controller
                  name="grantId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="grantId"><SelectValue placeholder="Select a grant..." /></SelectTrigger>
                      <SelectContent>
                        {grants?.map(g => <SelectItem key={g.id} value={g.id}>{g.projectTitle} ({g.applicantName})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.grantId && <p className="text-sm text-destructive">{errors.grantId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalSpent">Total Amount Spent (UGX)</Label>
              <Input id="totalSpent" type="number" {...register('totalSpent')} />
              {errors.totalSpent && <p className="text-sm text-destructive">{errors.totalSpent.message}</p>}
            </div>
             <div className="space-y-2">
              <Label>Receipt URLs</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`receiptUrls.${index}.value`)} placeholder="Link to receipt image/doc" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Link</Button>
              {errors.receiptUrls && <p className="text-sm text-destructive">{errors.receiptUrls.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="outputDescription">Description of Outputs/Results</Label>
              <Textarea id="outputDescription" {...register('outputDescription')} />
              {errors.outputDescription && <p className="text-sm text-destructive">{errors.outputDescription.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Accountability
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
