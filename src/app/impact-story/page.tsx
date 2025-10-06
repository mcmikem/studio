import { ImpactStoryGenerator } from "@/components/impact-story-form";
import { Suspense } from 'react';

function ImpactStoryContent() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Impact Story Generator
        </h1>
        <p className="text-muted-foreground">
          Automatically generate compelling narratives from your activity data.
        </p>
      </header>
      <ImpactStoryGenerator />
    </div>
  );
}


export default function ImpactStoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ImpactStoryContent />
    </Suspense>
  )
}
