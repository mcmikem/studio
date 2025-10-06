'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { NewCheckinForm } from './new-checkin-form';
import { NewCheckoutForm } from './new-checkout-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export function DailyActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Hub</CardTitle>
        <CardDescription>
          Your one-stop-shop for daily planning and reporting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="check-in">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="check-in">Check In</TabsTrigger>
            <TabsTrigger value="check-out">Check Out</TabsTrigger>
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