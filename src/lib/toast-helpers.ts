'use client';

import { useToast } from '@/hooks/use-toast';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export function useAppToast() {
  const { toast } = useToast();

  const success = (options: ToastOptions) => {
    toast({
      title: options.title,
      description: options.description,
      variant: 'default',
      className: 'border-green-500 bg-green-50',
    });
  };

  const error = (options: ToastOptions) => {
    toast({
      title: options.title,
      description: options.description,
      variant: 'destructive',
    });
  };

  const info = (options: ToastOptions) => {
    toast({
      title: options.title,
      description: options.description,
    });
  };

  const loading = (options: ToastOptions) => {
    toast({
      title: options.title,
      description: options.description,
      variant: 'default',
      className: 'border-blue-500 bg-blue-50',
    });
  };

  return {
    success,
    error,
    info,
    loading,
    toast,
  };
}

// Helper functions for common operations
export const toastHelpers = {
  save: (item: string = 'Item') => ({
    title: `${item} saved`,
    description: 'Your changes have been saved successfully.',
  }),
  
  create: (item: string = 'Item') => ({
    title: `${item} created`,
    description: 'The new entry has been added.',
  }),
  
  update: (item: string = 'Item') => ({
    title: `${item} updated`,
    description: 'Your changes have been applied.',
  }),
  
  delete: (item: string = 'Item') => ({
    title: `${item} deleted`,
    description: 'The entry has been removed.',
  }),
  
  error: (message: string) => ({
    title: 'Something went wrong',
    description: message,
    variant: 'destructive' as ToastVariant,
  }),
  
  success: (message: string) => ({
    title: 'Success',
    description: message,
  }),
};
