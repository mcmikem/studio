import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HR Terminal | Omuto Central',
  description: 'Workforce management and institutional resource control.',
};

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
