'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClipboardEdit, LogOut, BarChart3, Receipt, LogIn, Megaphone, ArrowRight, School, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';

const formLinks = [
   {
    href: '/forms/school',
    title: 'School Program Application',
    description: 'For schools to apply for Omuto programs.',
    icon: School,
    tab: 'school'
  },
  {
    href: '/forms/attendance',
    title: 'Session Attendance',
    description: 'Track participants reached in any session or event.',
    icon: Users,
  },
  {
    href: '/forms/beneficiary-registration',
    title: 'Beneficiary Registration',
    description: 'Create a new profile for a program beneficiary.',
    icon: UserPlus,
  },
  {
    href: '/forms/check-in',
    title: 'Daily Check-in',
    description: 'Plan your day and align with team goals.',
    icon: LogIn,
    tab: 'check-in'
  },
  {
    href: '/forms/check-out',
    title: 'Daily Check-out',
    description: 'Report your impact and share key learnings.',
    icon: LogOut,
    tab: 'check-out'
  },
  {
    href: '/forms/expense',
    title: 'Expense Report',
    description: 'Submit a new expense or request funds.',
    icon: Receipt,
    tab: 'expense'
  },
  {
    href: '/forms/alert',
    title: 'Create Alert',
    description: 'Broadcast an important message to the team.',
    icon: Megaphone,
    tab: 'alert'
  },
]


export default function FormsPage() {

  return (
     
      
        
          
          Forms Hub
        
        
          Your central place for all daily reports, and logs.
        
      
      
        {formLinks.map(link => (
          
            
              
                
                    
                    {link.title}
                
              
              
                {link.description}
              
            
          
        ))}
      
    
  );
}

    