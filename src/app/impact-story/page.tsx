import { ImpactStoryForm } from "@/components/impact-story-form";

export default function ImpactStoryPage() {
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
      <ImpactStoryForm />
    </div>
  );
}
