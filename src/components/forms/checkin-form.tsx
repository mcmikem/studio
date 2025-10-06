'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AdvancedCheckinForm } from './advanced-checkin-form';

export function CheckinForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Strategic Plan</CardTitle>
        <CardDescription>
          Outline your mission, time blocks, and logistical needs for the day. Use the AI assistant to help you brainstorm.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdvancedCheckinForm />
      </CardContent>
    </Card>
  );
}
