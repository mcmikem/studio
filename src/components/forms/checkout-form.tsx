"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileUp, LogOut } from "lucide-react";
import { Separator } from "../ui/separator";

export function CheckoutForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Your Impact</CardTitle>
        <CardDescription>
          Summarize your achievements, learnings, and plan for tomorrow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <Label htmlFor="mission-accomplished" className="text-base font-semibold">
            Section 1: Mission Accomplishment
          </Label>
          <Textarea
            id="mission-accomplished"
            placeholder="What did you achieve? (This will be pre-filled with your morning's mission)"
            defaultValue="Delivered RED Campaign session at Greenhill PTA meeting. The session was well-received."
            className="min-h-[100px]"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="impact-parents">Parents Reached</Label>
              <Input id="impact-parents" type="number" placeholder="e.g., 35" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impact-volunteers">Volunteers Recruited</Label>
              <Input id="impact-volunteers" type="number" placeholder="e.g., 3" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="impact-prototypes">Prototypes Tested</Label>
              <Input id="impact-prototypes" type="number" placeholder="e.g., 5" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-base font-semibold">
            Section 2: Evidence & Documentation
          </Label>
          <Button variant="outline" className="w-full">
            <FileUp className="mr-2 h-4 w-4" />
            Add Photo/Video Proof
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Photos will be automatically tagged with activity and location.
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label htmlFor="learning" className="text-base font-semibold">
            Section 3: Learning & Adaptation
          </Label>
          <Textarea
            id="learning"
            placeholder="What should we do differently next time?"
             className="min-h-[80px]"
          />
        </div>

        <Separator />

         <div className="space-y-4">
          <Label htmlFor="tomorrow-plan" className="text-base font-semibold">
            Section 4: Plan Tomorrow's Win
          </Label>
          <Input id="tomorrow-plan" placeholder="Tomorrow's priority will be..." />
        </div>

        <Button size="lg" className="w-full">
          <LogOut className="mr-2 h-5 w-5" />
          Check Out & Submit Report
        </Button>
      </CardContent>
    </Card>
  );
}
