
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { operationalChecklists } from '@/lib/checklists';
import { ListChecks } from 'lucide-react';

export default function ChecklistsPage() {
  // For now, we will display the first checklist. This can be expanded later.
  const fieldVisitChecklist = operationalChecklists[0];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <ListChecks className="h-8 w-8" />
          Operational Checklists
        </h1>
        <p className="text-muted-foreground">
          Standard Operating Procedures to ensure quality and consistency.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{fieldVisitChecklist.title}</CardTitle>
          <CardDescription>{fieldVisitChecklist.category}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fieldVisitChecklist.sections.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <Separator className="my-2" />
              <div className="space-y-3 mt-4">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-3">
                    <Checkbox id={`${section.title}-${itemIndex}`} />
                    <label
                      htmlFor={`${section.title}-${itemIndex}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
