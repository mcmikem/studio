
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
import { PartnershipSchema as ServerPartnershipSchema, type Partnership } from "@/lib/types"; // Import the schema and type
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MultiSelect } from "@/components/ui/multi-select";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, Timestamp, doc } from "firebase/firestore";

const PartnershipFormSchema = ServerPartnershipSchema.omit({
    id: true,
    createdAt: true,
    lastContacted: true,
    health: true
}).extend({
    // Make these optional for the form, they will be set on submission
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
  initialData?: Partnership; // Optional: for editing existing partnerships
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export function PartnershipForm({ initialData, onSuccess, onCancel }: PartnershipFormProps) {
  const firestore = useFirestore();
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
  const { toast } = useToast();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
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
                  {ServerPartnershipSchema.shape.type.options.map((typeOption) => (
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

        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormDescription>Primary contact person at the partnership.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="e.g., +256 770 123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isSchool && (
          <div className="space-y-6 border-t pt-8 mt-8">
            <h3 className="text-lg font-medium">School Specific Details</h3>
            <FormField
              control={form.control}
              name="schoolDetails.headTeacher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Head Teacher</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mr. John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schoolDetails.studentPopulation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Population</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 500" {...field} onChange={event => field.onChange(+event.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schoolDetails.level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select school level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ServerPartnershipSchema.shape.schoolDetails.unwrap().shape.level.options.map((levelOption: string) => (
                        <SelectItem key={levelOption} value={levelOption}>
                          {levelOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schoolDetails.championTeacher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Champion Teacher</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ms. Alice Brown" {...field} />
                  </FormControl>
                  <FormDescription>Teacher responsible for specific programs (e.g., Green Schools).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schoolDetails.championTeacherContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Champion Teacher Contact</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g., +256 780 987654" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schoolDetails.programs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enrolled Programs</FormLabel>
                    <MultiSelect
                        options={[{label: "GreenSchools", value: "GreenSchools"}, {label: "OFA", value: "OFA"}, {label: "RED Campaign", value: "RED Campaign"}]}
                        onValueChange={field.onChange}
                        defaultValue={field.value || []}
                        placeholder="Select programs..."
                    />
                  <FormDescription>Programs the school is currently enrolled in.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="space-y-6 border-t pt-8 mt-8">
          <h3 className="text-lg font-medium">Pipeline & Action Details</h3>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select partnership status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ServerPartnershipSchema.shape.status.options.map((statusOption: string) => (
                      <SelectItem key={statusOption} value={statusOption}>
                        {statusOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Current stage of the partnership in the pipeline.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextStep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Step</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Schedule follow-up meeting to discuss MoU" {...field} />
                </FormControl>
                <FormDescription>What is the immediate next action for this partnership?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextActionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Action Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Due date for the next action.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? "Save Changes" : "Create Partnership"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
