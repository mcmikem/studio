'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NotificationPromptProps {
    className?: string;
}

export function NotificationPrompt({ className }: NotificationPromptProps) {
    const [dismissed, setDismissed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | 'unknown'>('unknown');

    useEffect(() => {
        if (typeof Notification === 'undefined') {
            setPermission('unsupported');
            return;
        }
        if (Notification.permission === 'default' && localStorage.getItem('notificationPromptDismissed')) {
            setDismissed(true);
        }
        setPermission(Notification.permission);
    }, []);

    if (permission === 'granted' || permission === 'denied' || permission === 'unsupported' || dismissed) {
        return null;
    }

    const requestPermission = async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                setDismissed(true);
            }
        } catch (err) {
            console.warn('[NotificationPrompt] Permission request failed:', err);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('notificationPromptDismissed', 'true');
    };

    return (
        <Card className={cn('border-primary/20 bg-primary/5 shadow-sm', className)}>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-omuto-navy leading-tight">Enable push notifications</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Get alerts for expense approvals, daily reminders, and team updates — even when the app is closed.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" onClick={requestPermission} className="h-8 text-[11px] font-bold">
                        Enable
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8 flex-shrink-0">
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
