'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, PiggyBank, ArrowUpCircle, Banknote, FileText,
  ShieldCheck, ReceiptText, BarChart3, Settings, ChevronDown, Menu
} from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { viewAsRole } = useViewAs();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const effectiveRole = viewAsRole || profile?.role;

  const financeRoles = [
    'Administrator',
    'Executive Director',
    'Media & Finance Lead',
    'Media & Communications Lead',
    'Programs & Partnerships Manager',
    'Operations & Field Manager',
  ];

  if (!financeRoles.includes(effectiveRole || '')) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view the Finance section.</p>
      </div>
    );
  }

  const canManageAll = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'].includes(effectiveRole || '');

  const tabs = [
    { name: 'Dashboard', href: '/finance/dashboard', icon: LayoutDashboard },
    { name: 'Income', href: '/finance/income', icon: ArrowUpCircle },
    { name: 'Requisitions', href: '/finance/requisitions', icon: FileText },
    { name: 'Accountabilities', href: '/finance/accountabilities', icon: ShieldCheck },
    { name: 'Claims', href: '/finance/claims', icon: ReceiptText },
    { name: 'Petty Cash', href: '/finance/petty-cash', icon: Banknote },
    { name: 'Budgeting', href: '/finance/budgeting', icon: PiggyBank },
    { name: 'Reports', href: '/finance/reports', icon: BarChart3 },
    ...(canManageAll ? [{ name: 'Settings', href: '/finance/settings', icon: Settings }] : []),
  ];

  const activeTab = tabs.find(tab => pathname.startsWith(tab.href));

  return (
    <div className="w-full">
      {/* Mobile Navigation */}
      <div className="lg:hidden mb-4">
        <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-12 px-4">
              <span className="flex items-center gap-2">
                {activeTab ? <activeTab.icon className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="font-medium">{activeTab?.name || 'Finance'}</span>
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-screen min-w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]">
            {tabs.map((tab) => (
              <DropdownMenuItem key={tab.href} asChild>
                <Link
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3',
                    pathname.startsWith(tab.href) && 'bg-muted font-medium'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:block mb-6">
        <nav className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                pathname.startsWith(tab.href)
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
