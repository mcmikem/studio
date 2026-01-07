'use client';

import { useViewAs } from '@/hooks/use-view-as';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

export function ViewAsBanner() {
    const { viewAsRole, clearViewAs } = useViewAs();
    if (!viewAsRole) return null;

    return (
        <div className="bg-yellow-400 text-yellow-900 text-sm font-medium p-3 flex items-center justify-center gap-4 sticky top-0 z-50">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-xs sm:text-sm">Viewing as a <strong>{viewAsRole}</strong>.</span>
            <Button
                variant="ghost"
                size="sm"
                className="hover:bg-yellow-500/50 h-8 px-2"
                onClick={clearViewAs}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}
