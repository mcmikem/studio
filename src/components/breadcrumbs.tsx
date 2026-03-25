'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'finance': 'Finance',
  'hr': 'HR',
  'school-xperience': 'School Xperience',
  'meal': 'MEAL',
  'enterprise': 'Enterprise',
  'management': 'Management',
  'self-service': 'Self Service',
  'forms': 'Forms',
  'calendar': 'Calendar',
  'workplan': 'Workplan',
  'settings': 'Settings',
  'requisitions': 'Requisitions',
  'income': 'Income',
  'reports': 'Reports',
  'accountabilities': 'Accountabilities',
  'leave': 'Leave',
  'payroll': 'Payroll',
  'assets': 'Assets',
  'structures': 'Structures',
  'impact-data': 'Impact Data',
  'impact': 'Impact',
  'pipeline': 'Pipeline',
  'log-impact': 'Log Impact',
  'log-visit': 'Log Visit',
  'register-school': 'Register School',
  'beneficiary-registration': 'Register Beneficiary',
  'activity': 'Activity',
  'yoskills': 'YoSkills',
  'essentials': 'Essentials',
  'youth-center': 'Youth Center',
  'attendance': 'Attendance',
  'payslips': 'Payslips',
  'grievances': 'Grievances',
  'performance': 'Performance',
  'talents': 'Talents',
  'system': 'System',
  'chat': 'Chat',
  'checkins': 'Check-ins',
  'checklists': 'Checklists',
  'daily-plan': 'Daily Plan',
  'activity-log': 'Activity Log',
  'team-performance': 'Team Performance',
  'testimonies': 'Testimonies',
};

function formatLabel(slug: string): string {
  if (routeLabels[slug]) return routeLabels[slug];
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Breadcrumbs() {
  const pathname = usePathname();
  
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .slice(0, 4);

  if (segments.length <= 1) return null;

  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    return {
      label: formatLabel(segment),
      href: isLast ? undefined : href,
    };
  });

  return (
    <nav className="flex items-center gap-1 text-xs mb-2 overflow-x-auto">
      <Link 
        href="/" 
        className="flex items-center gap-1 text-muted-foreground hover:text-omuto-navy transition-colors shrink-0"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      
      {breadcrumbs.map((item, index) => (
        <span key={index} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          {item.href ? (
            <Link 
              href={item.href}
              className="text-muted-foreground hover:text-omuto-navy transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-bold text-omuto-navy">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
