'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { alerts } from '@/lib/data';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

const alertIcons = {
    Urgent: <AlertTriangle className="h-4 w-4 text-red-500" />,
    Reminder: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    Info: <Info className="h-4 w-4 text-blue-500" />,
};

const alertColors = {
    High: "border-red-500 bg-red-500/10 text-red-500",
    Medium: "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    Low: "border-blue-500 bg-blue-500/10 text-blue-500",
};


export function Alerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts & Notifications</CardTitle>
        <CardDescription>Urgent issues and important reminders.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <div className="mt-1">
              {alertIcons[alert.type]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{alert.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${alertColors[alert.priority]}`}>{alert.priority} Priority</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary self-center">{alert.action}</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
