'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import Link from 'next/link';
import {
  Star, StarHalf, Video, Calendar, MapPin, 
  Heart, Flower2, GraduationCap, Droplets, Building2,
  ArrowLeft, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';

const PROGRAMME_ICONS: Record<string, React.ElementType> = {
  SLF: GraduationCap,
  RED: Heart,
  GreenSchools: Flower2,
  PureWater: Droplets,
};

export default function StoriesPage() {
  const firestore = useFirestore();

  const flaggedVisitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sx-visits'),
      where('flagForStory', '==', true),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const schoolsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sx-schools'), orderBy('schoolName'));
  }, [firestore]);

  const { data: flaggedVisits, isLoading: visitsLoading } = useCollection<any>(flaggedVisitsQuery);
  const { data: schools } = useCollection<any>(schoolsQuery);

  const getSchool = (schoolId: string) => schools?.find(s => s.id === schoolId);

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Video}
        title="Stories"
        description="Flagged visits ready for media storytelling and impact reporting."
        breadcrumbs={[
          { name: 'Dashboard', href: '/' },
          { name: 'School Xperience', href: '/school-xperience' },
          { name: 'Stories', href: '/school-xperience/stories' },
        ]}
      />

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Video className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Story Candidates</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These visits have been flagged by field officers as having strong storytelling potential.
              Click on any story to see visit details and photos.
            </p>
          </div>
        </div>
      </div>

      {visitsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : !flaggedVisits || flaggedVisits.length === 0 ? (
        <Card className="border-lg shadow-comic-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Video className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg">No stories flagged yet</p>
            <p className="text-sm mt-2">Field officers can flag visits during monitoring to mark them as story candidates.</p>
            <Button asChild className="mt-6 btn-omuto rounded-xl">
              <Link href="/school-xperience">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Hub
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flaggedVisits.map(visit => {
            const school = getSchool(visit.schoolId);
            const dateVal = visit.date as any;
            const visitDate = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
            
            return (
              <Card key={visit.id} className="border-lg shadow-comic-sm overflow-hidden hover:shadow-lg transition-shadow">
                {visit.photos && visit.photos.length > 0 && (
                  <div className="relative h-40 bg-muted">
                    <img
                      src={visit.photos[0]}
                      alt="Story cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500 text-white font-bold text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Story
                      </Badge>
                    </div>
                    {visit.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-1">
                        <p className="text-white text-xs font-bold flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {visit.photos.length} photos
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm">{school?.schoolName || 'Unknown School'}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(visitDate, 'MMM d, yyyy')}
                        <span>by {visit.visitor}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visit.programmesCovered && visit.programmesCovered.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {visit.programmesCovered.map((p: string) => {
                        const Icon = PROGRAMME_ICONS[p] || Star;
                        return (
                          <Badge key={p} variant="outline" className="text-xs font-bold gap-1">
                            <Icon className="h-3 w-3" />
                            {p}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {visit.objectivesMet}
                  </p>

                  {visit.teacherFeedback && (
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Teacher Says</p>
                      <p className="text-xs mt-1 italic">"{visit.teacherFeedback}"</p>
                    </div>
                  )}

                  {visit.studentFeedback && (
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Student Says</p>
                      <p className="text-xs mt-1 italic">"{visit.studentFeedback}"</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1 h-8 rounded-lg text-xs font-bold">
                      <Link href={`/school-xperience/${visit.schoolId}`}>
                        <Building2 className="h-3 w-3 mr-1" />
                        View School
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
