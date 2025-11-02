
'use client';

import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Partnership } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MultiSelect } from "@/components/ui/multi-select";


const partnershipSchema = z.object({
  name: z.string().min(3, "Organization name is required."),
  type: z.enum(["NGO", "Government", "Corporate", "Individual"]),
  focusAreas: z.array(z.string()).optional(),
  contactPerson: z.string().min(3, "Contact person is required."),
  contactRole: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Invalid email address."),
  offers: z.array(z.string()).optional(),
  receives: z.array(z.string()).optional(),
  financialValue: z.coerce.number().optional(),
  inKindValue: z.string().optional(),
  strategicValue: z.string().optional(),
  strategicFit: z.coerce.number().min(1).max(5).optional(),
  resourcePotential: z.enum(["High", "Medium", "Low"]).optional(),
  riskLevel: z.enum(["High", "Medium", "Low"]).optional(),
  priority: z.enum(["Immediate", "Short-term", "Long-term"]).optional(),
  status: z.enum(["Prospecting", "Negotiation", "Active", "Stalled"]),
  nextStep: z.string().min(3, "Next step is required."),
});

type PartnershipFormData = z.infer<typeof partnershipSchema>;


const focusAreaOptions = [
    { value: 'Education', label: 'Education' },
    { value: 'Health', label: 'Health' },
    { value: 'Environment', label: 'Environment' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Youth Empowerment', label: 'Youth Empowerment' },
    { value: 'Entrepreneurship', label: 'Entrepreneurship' },
];

const valueOptions = [
    { value: 'Funding', label: 'Funding' },
    { value: 'Expertise', label: 'Expertise' },
    { value: 'Volunteers', label: 'Volunteers' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Network', label: 'Network' },
    { value: 'Community Access', label: 'Community Access' },
    { value: 'Implementation', label: 'Implementation' },
    { value: 'Youth Engagement', label: 'Youth Engagement' },
    { value: 'Media', label: 'Media' },
];

export function PartnershipForm({
  partnership,
  onFormSubmit,
}: {
  partnership?: Partnership;
  onFormSubmit: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<PartnershipFormData>({
    resolver: zodResolver(partnershipSchema),
     defaultValues: partnership || {
      status: 'Prospecting',
      type: 'NGO',
      focusAreas: [],
      offers: [],
      receives: [],
      financialValue: 0,
      strategicFit: 3,
      resourcePotential: 'Medium',
      riskLevel: 'Low',
      priority: 'Short-term',
    },
  });

  const onSubmit = async (data: z.infer<typeof partnershipSchema>) => {
    if (!firestore) return;

    const partnershipData: Partial<Partnership> = { ...data, lastContacted: serverTimestamp() as Timestamp, };

    if (partnership) {
        const partnershipRef = doc(firestore, 'partnerships', partnership.id);
        updateDocumentNonBlocking(partnershipRef, partnershipData);
        toast({
            title: "Partnership Updated!",
            description: `${data.name} has been successfully updated.`,
        });
    } else {
        const partnershipsCollection = collection(firestore, 'partnerships');
        partnershipData.createdAt = serverTimestamp() as Timestamp;
        partnershipData.health = "Strong"; // Default health for new partners
        addDocumentNonBlocking(partnershipsCollection, partnershipData);
        toast({
          title: "Partnership Added!",
          description: `${data.name} has been added to your partner database.`,
        });
    }
    
    reset();
    onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
    <ScrollArea className="h-[70vh] pr-6">
      <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Partner Information</h3>
        <div className="space-y-4 rounded-lg border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input id="name" {...register("name")} placeholder="e.g., UNICEF" />
                    {errors.name && <p className="text-sm text-destructive">{`${errors.name.message}`}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Controller name="type" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="NGO">NGO</SelectItem><SelectItem value="Government">Government</SelectItem><SelectItem value="Corporate">Corporate</SelectItem><SelectItem value="Individual">Individual</SelectItem></SelectContent>
                        </Select>
                    )} />
                </div>
            </div>
             <div className="space-y-2">
                <Label>Focus Areas</Label>
                <Controller name="focusAreas" control={control} render={({ field }) => <MultiSelect options={focusAreaOptions} onValueChange={field.onChange} defaultValue={field.value || []} placeholder="Select focus areas..." />} />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input id="contactPerson" {...register("contactPerson")} placeholder="e.g., Jane Doe" />
                    {errors.contactPerson && <p className="text-sm text-destructive">{`${errors.contactPerson.message}`}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactRole">Contact Role</Label>
                    <Input id="contactRole" {...register("contactRole")} placeholder="e.g., Program Manager" />
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" {...register("contactEmail")} placeholder="e.g., jane.doe@example.com" />
                    {errors.contactEmail && <p className="text-sm text-destructive">{`${errors.contactEmail.message}`}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" {...register("contactPhone")} placeholder="e.g., 07..." />
                </div>
            </div>
        </div>
      </div>

       <div className="space-y-2">
        <h3 className="font-semibold text-lg">Partnership Details</h3>
        <div className="space-y-4 rounded-lg border p-4">
             <div className="space-y-2">
                <Label>What They Offer</Label>
                <Controller name="offers" control={control} render={({ field }) => <MultiSelect options={valueOptions} onValueChange={field.onChange} defaultValue={field.value || []} placeholder="e.g., Funding, Expertise..." />} />
            </div>
             <div className="space-y-2">
                <Label>What We Offer</Label>
                 <Controller name="receives" control={control} render={({ field }) => <MultiSelect options={valueOptions} onValueChange={field.onChange} defaultValue={field.value || []} placeholder="e.g., Community Access..." />} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="financialValue">Expected Financial Value (UGX)</Label>
                    <Input id="financialValue" type="number" {...register("financialValue")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="inKindValue">In-kind Value</Label>
                    <Input id="inKindValue" {...register("inKindValue")} placeholder="e.g., Equipment, Volunteers" />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="strategicValue">Strategic Value</Label>
                <Textarea id="strategicValue" {...register("strategicValue")} placeholder="e.g., Access to new schools, credibility" />
            </div>
        </div>
      </div>

       <div className="space-y-2">
        <h3 className="font-semibold text-lg">Initial Assessment</h3>
        <div className="space-y-4 rounded-lg border p-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Strategic Fit (1-5)</Label>
                    <Input type="number" min="1" max="5" {...register("strategicFit")} />
                </div>
                 <div className="space-y-2">
                    <Label>Resource Potential</Label>
                    <Controller name="resourcePotential" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                        </Select>
                    )} />
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Risk Level</Label>
                    <Controller name="riskLevel" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                        </Select>
                    )} />
                </div>
                <div className="space-y-2">
                    <Label>Priority</Label>
                    <Controller name="priority" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="Immediate">Immediate</SelectItem><SelectItem value="Short-term">Short-term</SelectItem><SelectItem value="Long-term">Long-term</SelectItem></SelectContent>
                        </Select>
                    )} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Partnership Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Prospecting">Prospecting</SelectItem>
                            <SelectItem value="Negotiation">Negotiation</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Stalled">Stalled</SelectItem>
                        </SelectContent>
                    </Select>
                )} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="nextStep">Next Step</Label>
                <Input id="nextStep" {...register("nextStep")} placeholder="e.g., Follow up on MoU" />
                {errors.nextStep && <p className="text-sm text-destructive">{`${errors.nextStep.message}`}</p>}
            </div>
        </div>
      </div>
      </div>
      </ScrollArea>
      <DialogFooter className="pt-6">
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (partnership ? 'Saving...' : 'Adding...') : (partnership ? 'Save Changes' : 'Add Partnership')}
        </Button>
      </DialogFooter>
    </form>
  );
}

    