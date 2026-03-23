'use client';

import { useSearchParams } from 'next/navigation';
import { CaptureImpactStoryForm } from '@/components/forms/impact/capture-impact-story-form';

export default function RecordTestimonyPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const backHref = from === 'meal' ? '/meal' : '/';
  return <CaptureImpactStoryForm backHref={backHref} />;
}
