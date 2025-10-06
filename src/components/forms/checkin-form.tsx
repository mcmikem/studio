'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { NewCheckinForm } from '../dashboard/new-checkin-form';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { AdvancedCheckinForm } from './advanced-checkin-form';
import { Wand2 } from 'lucide-react';


export function CheckinForm() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Check-in</CardTitle>
        <CardDescription>
          Quickly log your primary mission for the day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NewCheckinForm />
      </CardContent>
      <CardFooter>
         <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-plan">
                <AccordionTrigger>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wand2 className="h-4 w-4" />
                        Need to create a detailed plan?
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <AdvancedCheckinForm />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </CardFooter>
    </Card>
  );
}
