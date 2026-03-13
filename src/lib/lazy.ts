import type { ComponentType } from 'react';

export type LazyLoader<T extends ComponentType<any>> = () => Promise<{ default: T }>;

export function createLazyImport<T extends ComponentType<any>>(
  loader: LazyLoader<T>,
  fallback?: React.ReactNode
) {
  return {
    lazy: () => import('next/dynamic').then((dyn) => 
      dyn.default(loader, { ssr: false, loading: () => fallback })
    ),
  };
}

export const lazyChart = () => import('@/components/ui/chart');
export const lazyDataTable = () => import('@/components/ui/data-table');
export const lazyDialog = () => import('@/components/ui/dialog');
export const lazySheet = () => import('@/components/ui/sheet');
export const lazyCommand = () => import('@/components/ui/command');
export const lazyRecharts = () => import('recharts');
