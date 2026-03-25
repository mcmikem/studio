import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Hub | Omuto Central',
  description: 'Personal terminal for Omuto Foundation team members.',
};

export default function SelfServiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
