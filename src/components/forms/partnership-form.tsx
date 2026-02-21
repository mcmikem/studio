
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { PartnershipSchema, Partnership } from "@/lib/types"; // Import the schema and type
import { toast } from "@/hooks/use-toast";

interface PartnershipFormProps {
  initialData?: Partnership; // Optional: for editing existing partnerships
  onSuccess: (data: Partnership) => void;
  onCancel: () => void;
}

export function PartnershipForm({ initialData, onSuccess, onCancel }: PartnershipFormProps) {
  const form = useForm<Partnership>({
    resolver: zodResolver(PartnershipSchema),
    defaultValues: initialData || {
      id: "", // Will be generated on creation
      name: "",
      type: "NGO", // Default type
      contactPerson: "",
      nextStep: "",
      status: "Prospecting", // Default status
      createdAt: new Date().toISOString(),
      lastContacted: new Date().toISOString(),
      focusAreas: [],
      offers: [],
      receives: [],
      // programs is part of schoolDetails, but setting a default for safety
      schoolDetails: {
        programs: [],
      },
    },
  });

  const watchPartnershipType = form.watch("type");
  const isSchool = watchPartnershipType === "School";

  function onSubmit(data: Partnership) {
    // In a real application, you would send this data to an API
    console.log("Form submitted:", data);
    toast({
      title: "Partnership Saved!",
      description: initialData
        ? `Partnership "${data.name}" updated successfully.`
        : `New partnership "${data.name}" created successfully.`,
    });
    onSuccess(data); // Call success callback
  }

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
                  {PartnershipSchema.shape.type.options.map((typeOption) => (
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
                    <Input type="number" placeholder="e.g., 500" {...field} />
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
                      {PartnershipSchema.shape.schoolDetails.unwrap().shape.level.unwrap().options.map((levelOption) => (
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
            {/* Note: programs field will likely be a multi-select or tags input in a more advanced UI */}
            <FormField
              control={form.control}
              name="schoolDetails.programs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enrolled Programs (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Green Schools, OFA"
                      value={field.value?.join(', ') || ''}
                      onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                    />
                  </FormControl>
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
                    {PartnershipSchema.shape.status.options.map((statusOption) => (
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

          {/* Note: nextActionDate would ideally use a date picker component */}
          <FormField
            control={form.control}
            name="nextActionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Action Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().substring(0, 10) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '')} />
                </FormControl>
                <FormDescription>Due date for the next action.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Value Exchange (offers/receives) and other fields like focusAreas, financialValue, etc., can be added here
            They might use multi-selects, tags, or other specialized input components.
            For now, keeping them simple or omitting for brevity. */}

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
