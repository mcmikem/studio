
'use client';

import ManagementLayoutComponent from '@/components/management/layout';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManagementLayoutComponent>{children}</ManagementLayoutComponent>;
}
