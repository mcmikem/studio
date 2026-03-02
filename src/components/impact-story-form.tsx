
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { runImpactStoryGenerator } from "@/ai/actions";
import type { ImpactStoryInput } from "@/lib/types";
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
import type { Activity, Checkout } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";
import { useSearchParams } from 'next/navigation';
import { formatDateSafe } from "@/lib/utils";


function ImpactStoryGeneratorContent() {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedCheckoutId, setSelectedCheckoutId] = useState<string | null>(null);
  const [generatedStory, setGeneratedStory] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const activityIdFromUrl = searchParams.get('activityId');
  const checkoutIdFromUrl = searchParams.get('checkoutId');

  useEffect(() => {
    if (activityIdFromUrl) {
      setSelectedActivityId(activityIdFromUrl);
      setSelectedCheckoutId(null);
    }
     if (checkoutIdFromUrl) {
      setSelectedCheckoutId(checkoutIdFromUrl);
      setSelectedActivityId(null);
    }
  }, [activityIdFromUrl, checkoutIdFromUrl]);


  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "activities"), orderBy("loggedAt", "desc"));
  }, [firestore]);

  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);

  const checkoutsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "checkouts"), orderBy("timestamp", "desc"));
  }, [firestore]);

  const { data: checkouts, isLoading: isLoadingCheckouts } = useCollection<Checkout>(checkoutsQuery);

  
  const selectedActivity = useMemo(() => {
    if (!selectedActivityId) return null;
    return activities?.find(a => a.id === selectedActivityId);
  }, [activities, selectedActivityId]);

  const selectedCheckout = useMemo(() => {
    if (!selectedCheckoutId) return null;
    return checkouts?.find(c => c.id === selectedCheckoutId);
  }, [checkouts, selectedCheckoutId]);


  const generateStory = async () => {
    let input: ImpactStoryInput | null = null;

    if (selectedActivity) {
        input = {
            activityName: selectedActivity.title,
            activityDescription: `An activity resulting in a ${selectedActivity.finalRoi.toFixed(0)}% ROI.`,
            activityImpact: `Total value of ${selectedActivity.totalValue.toLocaleString()} UGX generated from a cost of ${selectedActivity.actualCost.toLocaleString()} UGX.`,
            userName: selectedActivity.userName,
            userQuote: selectedActivity.beneficiaryQuote || "This program is making a real difference in our community!",
            memorableMoment: selectedActivity.memorableMoment,
            challengesLearned: selectedActivity.challengesLearned,
        };
    } else if (selectedCheckout) {
        const primaryTask = selectedCheckout.tasks?.[0]?.description || 'daily activities';
        const quote = selectedCheckout.learning || (selectedCheckout.tomorrowPlan ? `Tomorrow's focus: ${selectedCheckout.tomorrowPlan}` : "Reflecting on another impactful day.");
        input = {
            activityName: `Daily update from ${selectedCheckout.name}`,
            activityDescription: primaryTask,
            activityImpact: `A daily report from our ${selectedCheckout.role}.`,
            userName: selectedCheckout.name,
            userQuote: quote,
        };
    } else {
        toast({ variant: 'destructive', title: 'Please select an activity or checkout report.'});
        return;
    }

    setIsLoading(true);
    setGeneratedStory("");

    try {
      const result = await runImpactStoryGenerator(input);
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
  
  const dataToDisplay = selectedActivity || selectedCheckout;
  const isCheckout = !!selectedCheckout;
  const isLoadingData = isLoadingActivities || isLoadingCheckouts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Select a Source</CardTitle>
          <CardDescription>
            Choose a logged report to generate a story from its data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="activity-select">Recent Activity Reports (ROI)</Label>
            {isLoadingData ? <Skeleton className="h-10 w-full" /> : (
                 <Select onValueChange={id => { setSelectedActivityId(id); setSelectedCheckoutId(null); }} value={selectedActivityId || ''}>
                  <SelectTrigger id="activity-select">
                    <SelectValue placeholder="Select an ROI report..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activities?.map(activity => (
                        <SelectItem key={activity.id} value={activity.id}>
                            {activity.title} ({formatDateSafe(activity.loggedAt, 'dateOnly')})
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            )}
          </div>
          
           <div className="space-y-2">
             <Label htmlFor="checkout-select">Recent Checkout Reports</Label>
             {isLoadingData ? <Skeleton className="h-10 w-full" /> : (
                 <Select onValueChange={id => { setSelectedCheckoutId(id); setSelectedActivityId(null); }} value={selectedCheckoutId || ''}>
                  <SelectTrigger id="checkout-select">
                    <SelectValue placeholder="Select a checkout report..." />
                  </SelectTrigger>
                  <SelectContent>
                    {checkouts?.map(checkout => (
                        <SelectItem key={checkout.id} value={checkout.id}>
                            {checkout.name} - {formatDateSafe(checkout.timestamp, 'dateOnly')}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            )}
          </div>
          
          {dataToDisplay && (
             <Card className="bg-muted/50 p-4">
                 <CardTitle className="text-lg">{isCheckout ? `Update from ${(dataToDisplay as Checkout).name}` : (dataToDisplay as Activity).title}</CardTitle>
                 <CardDescription>Logged by {isCheckout ? (dataToDisplay as Checkout).name : (dataToDisplay as Activity).userName}</CardDescription>
                 <CardContent className="text-sm pt-4 space-y-1">
                    {isCheckout ? (
                       <>
                        <p><strong>Task:</strong> {(dataToDisplay as Checkout).tasks?.[0]?.description}</p>
                        <p><strong>Learning:</strong> {(dataToDisplay as Checkout).learning}</p>
                       </>
                    ) : (
                       <>
                        <p><strong>Final ROI:</strong> <span className={(dataToDisplay as Activity).finalRoi >= 0 ? 'text-green-500' : 'text-red-500'}>{`${(dataToDisplay as Activity).finalRoi.toFixed(0)}%`}</span></p>
                        <p><strong>Actual Cost:</strong> {`${(dataToDisplay as Activity).actualCost.toLocaleString()} UGX`}</p>
                        <p><strong>Total Value:</strong> {`${(dataToDisplay as Activity).totalValue.toLocaleString()} UGX`}</p>
                       </>
                    )}
                 </CardContent>
             </Card>
          )}

          <Button onClick={generateStory} disabled={isLoading || !dataToDisplay} className="w-full">
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Wand className="mr-2 h-4 w-4" />
            )}
            Generate Story
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
                <p className="mt-1 text-sm text-muted-foreground">Select a report to generate a compelling narrative about your work.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ImpactStoryGenerator() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ImpactStoryGeneratorContent />
    </Suspense>
  )
}
