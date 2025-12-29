
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { KnowledgeHubCTA } from '@/lib/types';
import { ArrowRight, PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface CallsToActionProps {
  ctas: KnowledgeHubCTA[];
  isEditMode: boolean;
  handleContentChange: (type: string, index: number, field: string, value: any) => void;
  handleAddItem: (type: string) => void;
  handleDeleteItem: (type: string, id: string, index: number) => void;
}

export function CallsToAction({ ctas, isEditMode, handleContentChange, handleAddItem, handleDeleteItem }: CallsToActionProps) {
  if (!ctas || ctas.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Calls-to-Action</CardTitle>
        {isEditMode && (
          <Button size="sm" variant="outline" onClick={() => handleAddItem('ctas')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add CTA
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ctas.map((cta, index) => (
          <div key={cta.id} className="p-4 bg-muted rounded-lg relative space-y-2">
            {isEditMode ? (
              <>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive h-7 w-7" onClick={() => handleDeleteItem('ctas', cta.id, index)}><Trash2 className="h-4 w-4" /></Button>
                <Input value={cta.title} onChange={(e) => handleContentChange('ctas', index, 'title', e.target.value)} className="font-semibold" />
                <Textarea value={cta.description} onChange={(e) => handleContentChange('ctas', index, 'description', e.target.value)} className="text-sm text-muted-foreground" />
                <Input value={cta.buttonLabel} onChange={(e) => handleContentChange('ctas', index, 'buttonLabel', e.target.value)} />
              </>
            ) : (
              <>
                <h4 className="font-semibold">{cta.title}</h4>
                <p className="text-sm text-muted-foreground">{cta.description}</p>
                <Button variant="outline" className="w-full justify-between">
                  {cta.buttonLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
