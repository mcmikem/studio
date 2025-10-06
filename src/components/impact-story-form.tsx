"use client";

import { useState, useMemo, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Sparkles, Wand } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Activity } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";
import { useSearchParams } from 'next/navigation';


const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function ImpactStoryGenerator() {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [generatedStory, setGeneratedStory] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const activityIdFromUrl = searchParams.get('activityId');

  useEffect(() => {
    if (activityIdFromUrl) {
      setSelectedActivityId(activityIdFromUrl);
    }
  }, [activityIdFromUrl]);


  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "activities"), orderBy("loggedAt", "desc"));
  }, [firestore]);

  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
  
  const selectedActivity = useMemo(() => {
    return activities?.find(a => a.id === selectedActivityId);
  }, [activities, selectedActivityId]);

  const generateStory = async () => {
    if (!selectedActivity) {
      toast({ variant: 'destructive', title: 'Please select an activity.'});
      return;
    }

    setIsLoading(true);
    setGeneratedStory("");

    try {
      // For now, we use a placeholder image as we haven't stored the uploaded one
      const photoDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

      const input: ImpactStoryInput = {
        activityName: selectedActivity.title,
        activityDescription: `An activity that resulted in a final ROI of ${selectedActivity.finalRoi.toFixed(0)}%.`,
        activityImpact: `This activity generated a total value of ${selectedActivity.totalValue.toLocaleString()} UGX from an actual cost of ${selectedActivity.actualCost.toLocaleString()} UGX.`,
        userName: selectedActivity.userName,
        userQuote: "This program is making a real difference in our community!", // Placeholder quote
        photoDataUri,
      };

      const result = await generateImpactStory(input);
      setGeneratedStory(result.impactStory);
    } catch (error) {
      console.error("Error generating story:", error);
      toast({
        variant: "destructive",
        title: "Error Generating Story",
        description: "There was an issue connecting to the AI service. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedStory) return;
    navigator.clipboard.writeText(generatedStory);
    toast({
      title: "Copied to clipboard!",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Select an Activity</CardTitle>
          <CardDescription>
            Choose a logged activity to generate a story from its data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="activity-select">Recent Activities</Label>
            {isLoadingActivities ? <Skeleton className="h-10 w-full" /> : (
                 <Select onValueChange={setSelectedActivityId} value={selectedActivityId || ''}>
                  <SelectTrigger id="activity-select">
                    <SelectValue placeholder="Select a logged activity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activities?.map(activity => (
                        <SelectItem key={activity.id} value={activity.id}>
                            {activity.title} ({new Date(activity.loggedAt.toDate()).toLocaleDateString()})
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            )}
          </div>
          
          {selectedActivity && (
             <Card className="bg-muted/50 p-4">
                 <CardTitle className="text-lg">{selectedActivity.title}</CardTitle>
                 <CardDescription>Logged by {selectedActivity.userName}</CardDescription>
                 <CardContent className="text-sm pt-4 space-y-1">
                     <p><strong>Final ROI:</strong> <span className={selectedActivity.finalRoi >= 0 ? 'text-green-500' : 'text-red-500'}>{selectedActivity.finalRoi.toFixed(0)}%</span></p>
                     <p><strong>Actual Cost:</strong> {selectedActivity.actualCost.toLocaleString()} UGX</p>
                     <p><strong>Total Value:</strong> {selectedActivity.totalValue.toLocaleString()} UGX</p>
                 </CardContent>
             </Card>
          )}

          <Button onClick={generateStory} disabled={isLoading || !selectedActivity} className="w-full">
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Wand className="mr-2 h-4 w-4" />
            )}
            Generate Story from Activity
          </Button>

        </CardContent>
      </Card>
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle>Generated Impact Story</CardTitle>
          <CardDescription>
            Your AI-generated story will appear here. Review and edit before use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Generating your story...</p>
            </div>
          )}
          {generatedStory && !isLoading && (
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
                className="h-full min-h-[400px] bg-muted"
              />
            </div>
          )}
          {!isLoading && !generatedStory && (
             <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed border-border text-center p-8">
                <Sparkles className="h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-lg font-semibold">Your Story Awaits</p>
                <p className="mt-1 text-sm text-muted-foreground">Select a logged activity to generate a compelling narrative about your work.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
