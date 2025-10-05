import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const templates = [
  {
    id: 1,
    title: 'Strategic Weekly Planner',
    description: 'Beyond basic to-do lists to impact maximization.',
    status: 'Coming Soon',
  },
  {
    id: 2,
    title: 'Strategic Daily Execution Framework',
    description: 'Moving beyond task lists to impactful action.',
    status: 'Coming Soon',
  },
  {
    id: 3,
    title: 'Volunteer Multiplier Framework',
    description: 'Beyond basic agreements to community empowerment.',
    status: 'Coming Soon',
  },
  {
    id: 4,
    title: 'Field Activity ROI Calculator',
    description: 'Ensuring every trip pays multiple dividends.',
    status: 'Live',
    href: '/roi-calculator'
  },
  {
    id: 5,
    title: 'Dignity Pads Commercialization Roadmap',
    description: 'Beyond prototypes to sustainable social enterprise.',
    status: 'Coming Soon',
  },
  {
    id: 6,
    title: 'Strategic Partnership Assessment',
    description: 'Beyond counting partners to building ecosystems.',
    status: 'Coming Soon',
  },
  {
    id: 7,
    title: 'Burnout Prevention & Capacity Management',
    description: 'Beyond surveys to proactive wellbeing.',
    status: 'Coming Soon',
  }
];

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Form Templates
        </h1>
        <p className="text-muted-foreground">
          Standardize data input and streamline operations with these custom forms.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{template.title}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter className="flex justify-between items-center">
              {template.status === 'Live' ? (
                <Button asChild>
                  <a href={template.href}>
                    Open Form <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {template.status}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
