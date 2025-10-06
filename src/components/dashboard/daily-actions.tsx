'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewCheckoutForm } from './new-checkout-form';
import { NewCheckinForm } from './new-checkin-form';
import { LogIn, LogOut } from 'lucide-react';

export function DailyActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Actions</CardTitle>
        <CardDescription>
          Start and end your day with impact.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="check-in">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="check-in">
                <LogIn className="mr-2 h-4 w-4" />
                Check In
            </TabsTrigger>
            <TabsTrigger value="check-out">
                <LogOut className="mr-2 h-4 w-4" />
                Check Out
            </TabsTrigger>
          </TabsList>
          <TabsContent value="check-in" className="pt-4">
            <NewCheckinForm />
          </TabsContent>
          <TabsContent value="check-out" className="pt-4">
            <NewCheckoutForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
