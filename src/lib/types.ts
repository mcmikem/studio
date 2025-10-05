import type { Timestamp } from 'firebase/firestore';

export type StatCard = {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
};

export type WeeklyActivity = {
  day: string;
  'Girl Child Day': number;
  'Tree Planting': number;
  'PTA Meeting': number;
};

export type RecentCheckout = {
  id?: string;
  name: string;
  role: string;
  avatar: string;
  task: string;
  time?: string;
  timestamp?: Timestamp;
};

export type PlanGoal = {
  title: string;
  description: string;
  details: string;
};

export type TeamMemberRole = {
  member: string;
  focus: string;
  deliverables: string;
};

export type SuccessMetric = {
  metric: string;
  green: string;
  yellow: string;
  red: string;
  response: string;
};

export type CalendarEvent = {
    date: Date;
    title: string;
    description: string;
};
