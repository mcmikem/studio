

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import type { Partnership, Proposal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Handshake, Goal, Building, PlusCircle, Edit, Trash2, Search, Loader2, Wand } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatDateSafe } from '@/lib/utils';
import { format } from 'date-fns';
import { findGrants, type GrantFinderOutput } from '@/ai/flows/grant-finder-flow';
import { Textarea } from '@/components/ui/textarea';
import { writeConceptNote } from '@/ai/flows/grant-writer-flow';
import { PartnershipForm } from '@/components/management/partnerships/partnership-form';


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(value);
};

const proposalSchema = z.object({
    title: z.string().min(5, 'Proposal title is required.'),
    partnerName: z.string().min(3, 'Partner name is required.'),
    amountRequested: z.coerce.number().min(1, 'Amount must be greater than 0.'),
    status: z.enum(['Draft', 'Submitted', 'In Review', 'Approved', 'Rejected']),
    submissionDate: z.string().min(1, "Submission date is required."),
    decisionDate: z.string().optional(),
    conceptNote: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    try {
        return format(new Date(date), 'yyyy-MM-dd');
    } catch {
        return '';
    }
};

function ProposalForm({ proposal, onFormSubmit }: { proposal?: Partial<Proposal>; onFormSubmit: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isGeneratingNote, setIsGeneratingNote] = useState(false);
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<ProposalFormData>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            title: proposal?.title || '',
            partnerName: proposal?.partnerName || '',
            amountRequested: proposal?.amountRequested || 0,
            status: proposal?.status || 'Draft',
            submissionDate: formatDateForInput(proposal?.submissionDate),
            decisionDate: formatDateForInput(proposal?.decisionDate),
            conceptNote: proposal?.conceptNote || '',
        }
    });

    const partnerName = watch('partnerName');
    const amountRequested = watch('amountRequested');

    const handleGenerateConceptNote = async () => {
        if (!partnerName || !amountRequested) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter a partner name and requested amount first.'});
            return;
        }
        setIsGeneratingNote(true);
        try {
            const result = await writeConceptNote({ partnerName, amountRequested });
            setValue('conceptNote', result.conceptNote);
            toast({ title: 'Concept Note Generated!', description: 'The AI has drafted a concept note for you.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to generate concept note.' });
        } finally {
            setIsGeneratingNote(false);
        }
    };

    const onSubmit = (data: ProposalFormData) => {
        if (!firestore) return;

        const proposalData = {
            ...data,
            createdAt: proposal?.createdAt || serverTimestamp(),
        };

        if (proposal?.id) {
            const proposalRef = doc(firestore, 'proposals', proposal.id);
            updateDocumentNonBlocking(proposalRef, proposalData);
            toast({ title: "Proposal Updated!", description: `${data.title} has been updated.` });
        } else {
            const proposalsCollection = collection(firestore, 'proposals');
            addDocumentNonBlocking(proposalsCollection, proposalData);
            toast({ title: "Proposal Added!", description: `${data.title} has been added to the tracker.` });
        }
        reset();
        onFormSubmit();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input id="title" {...register('title')} placeholder="e.g., Youth Skilling Grant" />
                {errors.title && <p className="text-sm text-destructive">{`${errors.title.message}`}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="partnerName">Partner/Funder</Label>
                    <Input id="partnerName" {...register('partnerName')} placeholder="e.g., GlobalGiving" />
                    {errors.partnerName && <p className="text-sm text-destructive">{`${errors.partnerName.message}`}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amountRequested">Amount Requested (UGX)</Label>
                    <Input id="amountRequested" type="number" {...register('amountRequested')} />
                    {errors.amountRequested && <p className="text-sm text-destructive">{`${errors.amountRequested.message}`}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="conceptNote">Concept Note</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateConceptNote} disabled={isGeneratingNote}>
                        {isGeneratingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand className="h-4 w-4 mr-2" />}
                        Write with AI
                    </Button>
                </div>
                <Textarea id="conceptNote" {...register('conceptNote')} placeholder="A brief summary of the project proposal..." className="min-h-[150px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="submissionDate">Submission Date</Label>
                    <Input id="submissionDate" type="date" {...register('submissionDate')} />
                    {errors.submissionDate && <p className="text-sm text-destructive">{`${errors.submissionDate.message}`}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="decisionDate">Decision Date (Optional)</Label>
                    <Input id="decisionDate" type="date" {...register('decisionDate')} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Submitted">Submitted</SelectItem>
                                <SelectItem value="In Review">In Review</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
             <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (proposal?.id ? 'Save Changes' : 'Add Proposal')}
                </Button>
            </DialogFooter>
        </form>
    );
}

function GrantDiscovery() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GrantFinderOutput | null>(null);
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [proposalToEdit, setProposalToEdit] = useState<Partial<Proposal> | undefined>(undefined);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults(null);
    try {
      const response = await findGrants({ query });
      setResults(response);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to find grants.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddToTracker = (opportunity: GrantFinderOutput['opportunities'][0]) => {
    setProposalToEdit({
        title: opportunity.title,
        partnerName: opportunity.funder,
        amountRequested: opportunity.amount,
        submissionDate: opportunity.deadline,
        status: 'Draft',
    });
    setIsFormOpen(true);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>AI Grant Discovery</CardTitle>
        <CardDescription>Find new funding opportunities using AI.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input 
            placeholder="Enter keywords, e.g., 'youth empowerment'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>
        {isLoading && (
            <div className="space-y-2 pt-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        )}
        {results && (
          <div className="pt-4 space-y-3">
             <h3 className="font-semibold">{results.opportunities.length} opportunities found for "{query}"</h3>
            {results.opportunities.map((op, i) => (
              <Card key={i} className="p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                    <div className="flex-grow">
                        <CardTitle className="text-base">{op.title}</CardTitle>
                        <CardDescription>{op.funder}</CardDescription>
                        <p className="text-sm mt-2">{op.description}</p>
                    </div>
                    <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-4 text-left sm:text-right">
                        <p className="font-bold text-lg">{formatCurrency(op.amount)}</p>
                        <p className="text-xs text-muted-foreground">Deadline: {formatDateSafe(op.deadline, 'dateOnly')}</p>
                         <Button size="sm" className="mt-2" onClick={() => handleAddToTracker(op)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add to Tracker
                        </Button>
                    </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
     <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
                <DialogTitle>Add New Proposal</DialogTitle>
                <DialogDescription>Review and save the discovered opportunity to your tracker.</DialogDescription>
            </DialogHeader>
            <ProposalForm proposal={proposalToEdit} onFormSubmit={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}


function FundingPipeline() {
  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'partnerships'),
      where('status', '==', 'Prospecting'),
      orderBy('name')
    );
  }, [firestore]);

  const { data: partnerships, isLoading } = useCollection<Partnership>(
    partnershipsQuery
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding Pipeline</CardTitle>
        <CardDescription>
          Potential partners we are actively engaging.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Next Step</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                </TableRow>
              ))}
            {partnerships && partnerships.length > 0 ? (
              partnerships.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.contactPerson}</TableCell>
                  <TableCell>{partner.nextStep}</TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No potential partners in the pipeline.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DonorDirectory() {
  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'partnerships'),
      where('status', '==', 'Active'),
      orderBy('name')
    );
  }, [firestore]);

  const { data: partnerships, isLoading } = useCollection<Partnership>(
    partnershipsQuery
  );

    return (
    <Card>
      <CardHeader>
        <CardTitle>Donor Directory</CardTitle>
        <CardDescription>
          A list of our active donors and partners.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="space-y-4">
            {isLoading && Array.from({length: 3}).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ))}
            {partnerships && partnerships.length > 0 ? (
                partnerships.map(partner => (
                    <div key={partner.id} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold">{partner.name}</p>
                            <p className="text-sm text-muted-foreground">{partner.contactPerson} - <a href={`mailto:${partner.contactEmail}`} className="text-primary hover:underline">{partner.contactEmail}</a></p>
                        </div>
                    </div>
                ))
            ) : (
                !isLoading && <p className="text-sm text-muted-foreground text-center p-8">No active partners found.</p>
            )}
         </div>
      </CardContent>
    </Card>
  );
}

function ProposalTracker() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
    const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

    const proposalsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'proposals'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: proposals, isLoading } = useCollection<Proposal>(proposalsQuery);

    const handleDelete = (proposal: Proposal) => {
        if (!firestore) return;
        const proposalRef = doc(firestore, 'proposals', proposal.id);
        deleteDocumentNonBlocking(proposalRef);
        toast({ title: 'Proposal Deleted', description: `"${proposal.title}" has been removed.` });
    };

    const statusColors: { [key: string]: string } = {
        "Draft": "border-gray-500 bg-gray-500/10 text-gray-500",
        "Submitted": "border-blue-500 bg-blue-500/10 text-blue-500",
        "In Review": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
        "Approved": "border-green-500 bg-green-500/10 text-green-500",
        "Rejected": "border-red-500 bg-red-500/10 text-red-500",
    };

    return (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Proposal Tracker</CardTitle>
                    <CardDescription>Manage grant proposals and funding applications.</CardDescription>
                </div>
                <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> New Proposal</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Add New Proposal</DialogTitle>
                            <DialogDescription>Enter the details for a new funding proposal.</DialogDescription>
                        </DialogHeader>
                        <ProposalForm onFormSubmit={() => setIsNewDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proposal Title</TableHead>
                            <TableHead>Partner</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submission Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                        {proposals && proposals.length > 0 ? (
                            proposals.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.title}</TableCell>
                                    <TableCell>{p.partnerName}</TableCell>
                                    <TableCell>{formatCurrency(p.amountRequested)}</TableCell>
                                    <TableCell><Badge variant="outline" className={statusColors[p.status]}>{p.status}</Badge></TableCell>
                                    <TableCell>{formatDateSafe(p.submissionDate, "dateOnly")}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => setEditingProposal(p)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the proposal "{p.title}".</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(p)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Goal className="h-12 w-12" />
                                            <span className="text-lg font-semibold">No Proposals Found</span>
                                            <p className="text-sm">Add a proposal to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
            </CardContent>
             {editingProposal && (
                <Dialog open={!!editingProposal} onOpenChange={(open) => !open && setEditingProposal(null)}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Edit Proposal</DialogTitle>
                            <DialogDescription>Update the details for "{editingProposal.title}".</DialogDescription>
                        </DialogHeader>
                        <ProposalForm proposal={editingProposal} onFormSubmit={() => setEditingProposal(null)} />
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
}

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Handshake className="h-8 w-8" />
          Resource Mobilization
        </h1>
        <p className="text-muted-foreground">
          Manage donor relations, funding opportunities, and proposals.
        </p>
      </header>

      <GrantDiscovery />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <FundingPipeline />
        </div>
        <div>
            <DonorDirectory />
        </div>
      </div>
      
       <ProposalTracker />
    </div>
  );
}
