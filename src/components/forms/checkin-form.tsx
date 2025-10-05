"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function CheckinForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Your Day for Maximum Impact</CardTitle>
        <CardDescription>
          Align your daily tasks with our strategic goals. This is the first
          step to a productive day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <Label htmlFor="primary-mission" className="text-base font-semibold">
            What's Your Primary Mission Today?
          </Label>
          <Select>
            <SelectTrigger id="primary-mission">
              <SelectValue placeholder="Select a mission from the operational plan..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mission-1">
                [OCT KR-3] Deliver RED Campaign session at Greenhill PTA
              </SelectItem>
              <SelectItem value="mission-2">
                [OCT KR-2] Plant 50 trees with Kibibi SS Green Team
              </SelectItem>
              <SelectItem value="mission-3">
                [WEEKLY] Finalize Dignity Pads branding with YoSkills grads
              </SelectItem>
              <SelectItem value="mission-other">Other...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold">
            How Will You Create Multiple Wins?
          </Label>
          <p className="text-sm text-muted-foreground">
            Based on your selected mission, here are some suggested secondary
            wins.
          </p>
          <div className="space-y-3 rounded-md border p-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="win-1" />
              <Label htmlFor="win-1" className="font-normal">
                Identify 2 parent champions for the RED campaign
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="win-2" />
              <Label htmlFor="win-2" className="font-normal">
                Test Dignity Pads prototypes with 5 parents for feedback
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="win-3" />
              <Label htmlFor="win-3" className="font-normal">
                Recruit 3 volunteers for the upcoming Football Gala
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="win-4" />
              <Label htmlFor="win-4" className="font-normal">
                Capture 5 high-quality photos & 1 video for Omuto Pulse
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold">
            Community Resources to Leverage
          </Label>
           <p className="text-sm text-muted-foreground">
            Available team members and volunteers in your location.
          </p>
          <div className="space-y-3 rounded-md border p-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="resource-1" />
              <Label htmlFor="resource-1" className="font-normal">
                Use Campus Ambassador: John (Makerere) for setup
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="resource-2" />
              <Label htmlFor="resource-2" className="font-normal">
                Engage Local Volunteer: Sarah (Mpigi) for translation
              </Label>
            </div>
          </div>
        </div>

        <Button size="lg" className="w-full">
          <LogIn className="mr-2 h-5 w-5" />
          Check In & Start Mission
        </Button>
      </CardContent>
    </Card>
  );
}
