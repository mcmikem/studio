
'use client';

import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="p-4 lg:p-6 h-full flex flex-col">
            <FirebaseErrorListener />
            {children}
        </main>
    )
}
