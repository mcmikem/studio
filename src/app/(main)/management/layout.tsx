
'use client';

import ManagementLayoutComponent from '@/components/management/management-layout';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManagementLayoutComponent>{children}</ManagementLayoutComponent>;
}
