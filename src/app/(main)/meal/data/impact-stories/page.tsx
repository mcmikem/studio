'use client';

import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/ui/data-table';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { BookOpen, MapPin, User, Calendar } from 'lucide-react';
import { Testimony } from '@/lib/types';
import { useUserProfile } from '@/hooks/use-user-profile';
import { canEdit, canDelete } from '@/lib/permissions';
import { deleteTestimonyAction } from '@/actions/mutations';
import { useToast } from '@/hooks/use-toast';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ImpactStoriesPage() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const { toast } = useToast();

  const testimoniesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'testimonies'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: testimonies, isLoading } = useCollection<Testimony>(testimoniesQuery);

  const columns = [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">{row.original.project}</span>
        </div>
      )
    },
    {
      header: 'Beneficiary',
      accessorKey: 'beneficiaryName',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span>{row.original.beneficiaryName}</span>
        </div>
      )
    },
    {
      header: 'Location',
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{row.original.district}</span>
          </div>
          <span className="text-muted-foreground ml-4">{row.original.subcounty}</span>
        </div>
      )
    },
    {
       header: 'Captured By',
       accessorKey: 'userName',
       cell: ({ row }: { row: any }) => (
         <Badge variant="outline" className="font-medium">{row.original.userName || 'Member'}</Badge>
       )
    },
    {
      header: 'Date',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2 text-xs">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>{formatDateSafe(row.original.createdAt, 'dateOnly')}</span>
        </div>
      )
    }
  ];

  const handleDelete = async (testimony: Testimony) => {
    const result = await deleteTestimonyAction(testimony.id);
    if (result.success) {
      toast({ title: 'Deleted', description: 'Impact story has been removed.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete story.' });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        icon={BookOpen}
        title="Impact Stories Archive"
        description="A collection of success stories, testimonies, and impact narratives from the field."
      />

      <DataTable 
        columns={columns}
        data={testimonies || []}
        isLoading={isLoading}
        currentUser={user}
        userProfile={profile}
        editHref={(testimony: Testimony) => `/meal/record-testimony?id=${testimony.id}`}
        deleteCollection="testimonies"
      />
    </div>
  );
}
