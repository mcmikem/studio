
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
import { DialogFooter } from "../ui/dialog";
import { Loader2 } from "lucide-react";

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
  initialData?: Partnership; 
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export function PartnershipForm({ initialData, onSuccess, onCancel }: PartnershipFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<PartnershipFormData>({
    resolver: zodResolver(PartnershipFormSchema),
    defaultValues: initialData || {
      name: "",
      type: "NGO",
      contactPerson: "",
      nextStep: "",
      status: "Prospecting",
      focusAreas: [],
      offers: [],
      receives: [],
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

    const submissionData: Partial<Partnership> = {
        ...data,
        lastContacted: serverTimestamp() as Timestamp,
        ...(data.nextActionDate && { nextActionDate: Timestamp.fromDate(new Date(data.nextActionDate)) })
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

    onSuccess(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[70vh] p-4">
            <div className="space-y-6">
                <h3 className="text-lg font-medium">General Partnership Details</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partnership Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Green Earth NGO" {...field} />
                      </FormControl>
                      <FormDescription>The official name of the partner organization or individual.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partnership Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a partnership type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PartnershipFormSchema.shape.type.options.map((typeOption: string) => (
                            <SelectItem key={typeOption} value={typeOption}>
                              {typeOption}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Categorize the type of partner.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            </ScrollArea>
        <DialogFooter>
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

    