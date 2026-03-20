'use client';

import { useParams } from 'next/navigation';
import { EditSchoolForm } from '@/components/forms/school-xperience/edit-school-form';

export default function EditSchoolPage() {
  const params = useParams();
  const schoolId = params.id as string;

  return <EditSchoolForm schoolId={schoolId} />;
}
