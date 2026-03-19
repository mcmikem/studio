'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, Timestamp, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { subDays } from 'date-fns';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert as AlertType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ToastItem {
    id: string;
    alert: AlertType;
}

function getIcon(type: string) {
    if (type === 'Urgent' || type === 'Warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    if (type === 'Info') return <Info className="h-4 w-4 text-blue-500" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
}

function getBgColor(priority: string) {
    if (priority === 'High') return 'border-l-4 border-l-red-500 bg-red-50';
    if (priority === 'Medium') return 'border-l-4 border-l-amber-400 bg-amber-50';
    return 'border-l-4 border-l-blue-400 bg-blue-50';
}

export function NotificationToast() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const initialLoadRef = useRef(true);

    useEffect(() => {
        if (!user || !firestore) return;

        const userAlertsQuery = query(
            collection(firestore, 'alerts'),
            where('targetUserIds', 'array-contains', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const broadcastAlertsQuery = query(
            collection(firestore, 'alerts'),
            where('targetUserIds', '==', []),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribeUser = onSnapshot(userAlertsQuery, (userSnap) => {
            if (initialLoadRef.current) {
                initialLoadRef.current = false;
                return;
            }
            const newAlerts = userSnap.docs
                .filter(doc => {
                    const createdAt = doc.data().createdAt as Timestamp | undefined;
                    const now = Date.now();
                    return createdAt && (now - createdAt.toMillis()) < 15000;
                })
                .map(doc => ({ id: doc.id, ...doc.data() } as AlertType));
            if (newAlerts.length > 0) {
                setToasts(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const unique = newAlerts.filter(a => !existingIds.has(a.id));
                    return [...unique.map(a => ({ id: a.id, alert: a })), ...prev].slice(0, 3);
                });
            }
        });

        const unsubscribeBroadcast = onSnapshot(broadcastAlertsQuery, (broadcastSnap) => {
            if (initialLoadRef.current) return;
            const newAlerts = broadcastSnap.docs
                .filter(doc => {
                    const createdAt = doc.data().createdAt as Timestamp | undefined;
                    const now = Date.now();
                    return createdAt && (now - createdAt.toMillis()) < 15000;
                })
                .map(doc => ({ id: doc.id, ...doc.data() } as AlertType));
            if (newAlerts.length > 0) {
                setToasts(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const unique = newAlerts.filter(a => !existingIds.has(a.id));
                    return [...unique.map(a => ({ id: a.id, alert: a })), ...prev].slice(0, 3);
                });
            }
        });

        return () => {
            unsubscribeUser();
            unsubscribeBroadcast();
        };
    }, [user, firestore]);

    const removeToast = (id: string) => {
        setDismissed(prev => new Set([...prev, id]));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const activeToasts = toasts.filter(t => !dismissed.has(t.id));

    if (activeToasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
            {activeToasts.map(toast => (
                <div
                    key={toast.id}
                    className={cn(
                        "animate-in slide-in-from-right-full duration-300",
                        "rounded-xl border shadow-lg p-3 flex items-start gap-3",
                        getBgColor(toast.alert.priority)
                    )}
                >
                    <div className="flex-shrink-0 mt-0.5">{getIcon(toast.alert.type)}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-omuto-navy leading-tight">{toast.alert.message}</p>
                        {toast.alert.action && toast.alert.action !== '/' && (
                            <Link href={toast.alert.action} onClick={() => removeToast(toast.id)}>
                                <span className="text-[11px] font-semibold text-primary underline mt-1 inline-block">
                                    View details →
                                </span>
                            </Link>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeToast(toast.id)}
                        className="h-6 w-6 flex-shrink-0 opacity-50 hover:opacity-100"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
