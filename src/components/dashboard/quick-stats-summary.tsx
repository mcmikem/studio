'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users, Briefcase, HandCoins, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

const quickStats = [
    { title: 'Youth Reached', value: 247, target: 500, icon: Users },
    { title: 'Schools Visited', value: 4, target: 8, icon: School },
    { title: 'Trees Planted', value: 612, target: 700, icon: Briefcase }, // Using Briefcase as a placeholder
    { title: 'Cycle of Dignity', value: 1350000, target: 2000000, icon: HandCoins, isCurrency: true },
    { title: 'Pulse Stories', value: 3, icon: ImageIcon },
    { title: 'Soap Units Sold', value: 45, icon: Briefcase }, // Placeholder icon
];

export function QuickStatsSummary() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 ml-1">🌍 Our Impact This Week</h2>
       <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            const progress = stat.target ? (stat.value / stat.target) * 100 : 0;
            const displayValue = stat.isCurrency ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(stat.value) : stat.value;
            const displayTarget = stat.target ? (stat.isCurrency ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(stat.target) : stat.target) : null;

            return (
              <CarouselItem key={index} className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{displayValue}</div>
                        {stat.target && (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    {`of ${displayTarget}`}
                                </p>
                                <Progress value={progress} className="mt-2 h-2" />
                            </>
                        )}
                    </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
