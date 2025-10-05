export type StatCard = {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
};

export type WeeklyActivity = {
  day: string;
  GirlChildDay: number;
  TreePlanting: number;
  PTAMeeting: number;
};

export type RecentCheckout = {
  name: string;
  role: string;
  avatar: string;
  task: string;
  time: string;
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
