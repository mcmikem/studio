
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, Zap, Heart, ShieldCheck } from 'lucide-react';

const TOUR_VERSION = '1.0';

export function RoleTour() {
  const { user } = useUser();
  const { profile, isLoading } = useUserProfile(user);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isLoading && profile) {
      const hasSeenTour = localStorage.getItem(`tour_seen_${profile.id}_${TOUR_VERSION}`);
      if (!hasSeenTour) {
        setIsOpen(true);
      }
    }
  }, [isLoading, profile]);

  if (!profile) return null;

  const isAdmin = ['Executive Director', 'Administrator', 'Accountant/Finance'].includes(profile.role);

  const steps = isAdmin ? [
    {
      title: "Welcome, Strategic Leader!",
      description: "You have access to the HQ tools. Use the 'Strategic Advisor' to get AI-powered insights on team performance.",
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    },
    {
      title: "Impact Monitoring",
      description: "The 'Activity Log' and 'OKR' tabs show real-time ROI and progress against our annual goals.",
      icon: <Target className="h-10 w-10 text-primary" />,
    },
    {
       title: "User Management",
       description: "Manage staff, volunteers, and their roles directly from the 'Users' tab in the sidebar.",
       icon: <Zap className="h-10 w-10 text-primary" />,
    }
  ] : [
    {
      title: "Welcome to the Field!",
      description: "Use the 'Daily Planner' every morning to sync your tasks with the organization's goals.",
      icon: <Sparkles className="h-10 w-10 text-secondary" />,
    },
    {
      title: "Instant Reporting",
      description: "Log your program activities and expenses on the fly. Don't worry about data—we've enabled offline saving!",
      icon: <Zap className="h-10 w-10 text-secondary" />,
    },
    {
      title: "Impact Stories",
      description: "Use the 'Testimony' tool to turn raw field observations into compelling impact stories using AI.",
      icon: <Heart className="h-10 w-10 text-secondary" />,
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    localStorage.setItem(`tour_seen_${profile.id}_${TOUR_VERSION}`, 'true');
    setIsOpen(false);
  };

  const current = steps[currentStep] || steps[0];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-lg shadow-comic rounded-3xl">
        <DialogHeader className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
          <div className="p-4 bg-muted rounded-full animate-bounce-slow">
            {current.icon}
          </div>
          <DialogTitle className="text-2xl font-black italic text-omuto-navy">{current.title}</DialogTitle>
          <DialogDescription className="text-base font-bold text-muted-foreground whitespace-pre-wrap">
            {current.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
            <div className="flex gap-1.5">
                {steps.map((_, i) => (
                    <div key={i} className={`h-2 w-2 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-primary w-6' : 'bg-muted'}`} />
                ))}
            </div>
        </div>
        <DialogFooter className="flex-row sm:justify-center gap-2">
          {currentStep > 0 && (
            <Button variant="ghost" className="font-bold" onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </Button>
          )}
          <Button onClick={handleNext} className="flex-1 btn-omuto font-bold h-12">
            {currentStep === steps.length - 1 ? "Let's Go!" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
