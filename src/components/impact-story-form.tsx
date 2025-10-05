"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  generateImpactStory,
  ImpactStoryInput,
} from "@/ai/flows/impact-story-generator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy } from "lucide-react";
import Image from "next/image";

const formSchema = z.object({
  activityName: z.string().min(3, "Activity name is required."),
  activityDescription: z.string().min(10, "Description is too short."),
  activityImpact: z.string().min(3, "Impact details are required."),
  userName: z.string().min(2, "User name is required."),
  userQuote: z.string().min(10, "Quote is too short."),
  photo: z.any().refine((file) => file?.length == 1, "Photo is required."),
});

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function ImpactStoryForm() {
  const [generatedStory, setGeneratedStory] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityName: "",
      activityDescription: "",
      activityImpact: "",
      userName: "",
      userQuote: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setGeneratedStory("");
    try {
      const photoDataUri = await fileToDataUri(values.photo[0]);

      const input: ImpactStoryInput = {
        activityName: values.activityName,
        activityDescription: values.activityDescription,
        activityImpact: values.activityImpact,
        userName: values.userName,
        userQuote: values.userQuote,
        photoDataUri,
      };

      const result = await generateImpactStory(input);
      setGeneratedStory(result.impactStory);
    } catch (error) {
      console.error("Error generating story:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate impact story. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedStory);
    toast({
      title: "Copied to clipboard!",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
          <CardDescription>
            Fill in the details of the activity to generate a story.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="activityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Girl Child Day @ Makerere" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activityDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the activity in detail..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activityImpact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurable Impact</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 150 students engaged, 300K raised" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sarah, a student leader" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userQuote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Quote</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A quote from a user about the activity..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Photo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormDescription>
                      A photo related to the activity.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Story
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Generated Impact Story</CardTitle>
          <CardDescription>
            Your AI-generated story will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Generating your story...</p>
            </div>
          )}
          {generatedStory && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Textarea
                readOnly
                value={generatedStory}
                className="h-full min-h-[500px] bg-muted"
              />
            </div>
          )}
          {!isLoading && !generatedStory && (
             <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center">
                <Image
                    src="https://picsum.photos/seed/impact-photo/800/600"
                    width={200}
                    height={150}
                    alt="Placeholder for impact story"
                    className="rounded-lg"
                    data-ai-hint="writing story"
                />
                <p className="mt-4 text-sm text-muted-foreground">Your generated story will be shown here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
