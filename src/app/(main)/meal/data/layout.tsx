'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
       <Button variant="outline" asChild>
            <Link href="/meal">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to MEAL Hub
            </Link>
        </Button>
      {children}
    </div>
  );
}
