
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PartnershipSchema as ServerPartnershipSchema, type Partnership } from "@/lib/types"; 
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MultiSelect } from "@/components/ui/multi-select";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, Timestamp, doc } from "firebase/firestore";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const PartnershipFormSchema = ServerPartnershipSchema.omit({
    id: true,
    createdAt: true,
    lastContacted: true,
    health: true
}).extend({
    nextActionDate: z.string().optional(),
});


type PartnershipFormData = z.infer<typeof PartnershipFormSchema>;


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

interface PartnershipFormProps {
  initialData?: Partnership | null; 
  onSuccess: () => void;
  onCancel: () => void;
}

export function PartnershipForm({ initialData, onSuccess, onCancel }: PartnershipFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<PartnershipFormData>({
    resolver: zodResolver(PartnershipFormSchema),
    defaultValues: initialData || {
      name: "",
      type: "NGO", // Default type
      contactPerson: "",
      nextStep: "",
      status: "Prospecting", // Default status
      focusAreas: [],
      offers: [],
      receives: [],
      financialValue: 0,
      strategicFit: 3,
      priority: 'Short-term',
      riskLevel: 'Low',
      resourcePotential: 'Medium',
      schoolDetails: {
        programs: [],
      },
    },
  });

  const { isSubmitting } = form.formState;

  const watchPartnershipType = form.watch("type");
  const isSchool = watchPartnershipType === "School";

  function onSubmit(data: PartnershipFormData) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firestore not available' });
      return;
    }
    
    const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

    const submissionData: Partial<Partnership> = {
        ...cleanedData,
        lastContacted: serverTimestamp() as Timestamp,
        ...(cleanedData.nextActionDate && { nextActionDate: Timestamp.fromDate(new Date(cleanedData.nextActionDate as string)) })
    };

    if(initialData?.id) {
        // Update
        const docRef = doc(firestore, 'partnerships', initialData.id);
        updateDocumentNonBlocking(docRef, submissionData);
        toast({ title: `Updated ${data.name}` });
    } else {
        // Create
        submissionData.createdAt = serverTimestamp() as Timestamp;
        submissionData.health = 'Strong';
        addDocumentNonBlocking(collection(firestore, 'partnerships'), submissionData);
        toast({ title: `Created ${data.name}` });
    }

    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[70vh] p-4 -mx-4">
            <div className="space-y-6 px-2">
                <h3 className="text-lg font-medium">Core Identity</h3>
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Partner Name</FormLabel><FormControl><Input placeholder="e.g., Green Earth NGO" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Partner Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{(PartnershipFormSchema.shape.type as z.ZodEnum<any>).options.map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="contactRole" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><FormControl><Input placeholder="e.g., Programs Manager" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g., jane.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>

                {isSchool && (
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium">School Details</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="schoolDetails.headTeacher" render={({ field }) => (<FormItem><FormLabel>Head Teacher</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="schoolDetails.studentPopulation" render={({ field }) => (<FormItem><FormLabel>Student Population</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)}/>
                         </div>
                         <FormField control={form.control} name="schoolDetails.level" render={({ field }) => (<FormItem><FormLabel>School Level</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{(PartnershipFormSchema.shape.schoolDetails.unwrap().shape.level.unwrap() as z.ZodEnum<any>).options.map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    </div>
                )}
                
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Value Exchange</h3>
                     <FormField control={form.control} name="focusAreas" render={({ field }) => (<FormItem><FormLabel>Focus Areas</FormLabel><FormControl><MultiSelect options={focusAreaOptions} onValueChange={field.onChange} defaultValue={field.value || []} placeholder="Select areas..." /></FormControl><FormMessage /></FormItem>)}/>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <FormField control={form.control} name="offers" render={({ field }) => (<FormItem><FormLabel>What They Offer</FormLabel><FormControl><MultiSelect options={valueOptions} onValueChange={field.onChange} defaultValue={field.value || []} placeholder="e.g., Funding..." /></FormControl><FormMessage /></FormItem>)}/>
                         <FormField control={form.control} name="receives" render={({ field }) => (<FormItem><FormLabel>What We Offer</FormLabel><FormControl><MultiSelect options={valueOptions} onValueChange={field.onChange} defaultValue={field.value || []} placeholder="e.g., Community Access..." /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Internal Assessment</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="financialValue" render={({ field }) => (<FormItem><FormLabel>Annual Financial Value (UGX)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="inKindValue" render={({ field }) => (<FormItem><FormLabel>In-Kind Value</FormLabel><FormControl><Input placeholder="e.g., Volunteers, venue" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                    <FormField control={form.control} name="strategicValue" render={({ field }) => (<FormItem><FormLabel>Strategic Value</FormLabel><FormControl><Textarea placeholder="e.g., Access to a new district, enhances our brand credibility..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="strategicFit" render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <FormLabel>Strategic Fit (1-5)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-4">
                            <Slider defaultValue={[value || 3]} min={1} max={5} step={1} onValueChange={(vals) => onChange(vals[0])} />
                            <span className="font-bold text-lg w-10 text-center">{value}</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <FormField control={form.control} name="resourcePotential" render={({ field }) => (<FormItem><FormLabel>Resource Potential</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{(PartnershipFormSchema.shape.resourcePotential.unwrap() as z.ZodEnum<any>).options.map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                         <FormField control={form.control} name="riskLevel" render={({ field }) => (<FormItem><FormLabel>Risk Level</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{(PartnershipFormSchema.shape.riskLevel.unwrap() as z.ZodEnum<any>).options.map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                         <FormField control={form.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{(PartnershipFormSchema.shape.priority.unwrap() as z.ZodEnum<any>).options.map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                     </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Action Plan</h3>
                     <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{(PartnershipFormSchema.shape.status as z.ZodEnum<any>).options.map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                     <FormField control={form.control} name="nextStep" render={({ field }) => (<FormItem><FormLabel>Next Step</FormLabel><FormControl><Textarea placeholder="e.g., Schedule follow-up meeting to discuss MoU..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                     <FormField control={form.control} name="nextActionDate" render={({ field }) => (<FormItem><FormLabel>Next Action Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter className="pt-6 border-t px-6 pb-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Save Changes" : "Create Partnership"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
