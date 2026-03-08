import type { Activity, Checkin, Checkout, Expense, Testimony, User } from '@/lib/types';

export interface PerformanceUserSummary {
  userId: string;
  name: string;
  photoURL?: string;
  role: string;
  totalScore: number;
  qualityIndex: number;
  activeMinutes: number;
  actions: { type: string; count: number; score: number }[];
  recentActivity: { type: string; title: string; date: any }[];
}

export function scoreCheckoutQuality(checkout: Checkout): number {
  const tasks = Array.isArray(checkout.tasks) ? checkout.tasks : [];
  if (tasks.length === 0) return 20;

  const doneTasks = tasks.filter((t) => t.status === 'Done');
  const doneRatio = doneTasks.length / tasks.length;

  const avgLength =
    doneTasks.length > 0
      ? doneTasks.reduce((sum, t) => sum + (t.description?.trim().length || 0), 0) / doneTasks.length
      : 0;

  const hasLearning = (checkout.learning || '').trim().length >= 20 ? 1 : 0;
  const hasTomorrowPlan = (checkout.tomorrowPlan || '').trim().length >= 20 ? 1 : 0;

  let quality = 30 + doneRatio * 35;
  quality += Math.min(20, avgLength / 4);
  quality += hasLearning * 8 + hasTomorrowPlan * 7;

  return Math.max(0, Math.min(100, Math.round(quality)));
}

export function buildPerformanceSummary(params: {
  users: User[] | null;
  activities: Activity[] | null;
  checkins: Checkin[] | null;
  checkouts: Checkout[] | null;
  expenses?: Expense[] | null;
  testimonies?: Testimony[] | null;
}): PerformanceUserSummary[] {
  const { users, activities, checkins, checkouts, expenses, testimonies } = params;
  if (!users) return [];

  const statsMap = new Map<string, PerformanceUserSummary & { qualitySamples: number[] }>();

  const getStats = (userId: string, userName?: string) => {
    if (statsMap.has(userId)) return statsMap.get(userId)!;
    const user = users.find((u) => u.id === userId);
    const initial = {
      userId,
      name: user?.name || userName || 'Staff Member',
      photoURL: user?.photoURL,
      role: user?.role || 'Staff',
      totalScore: 0,
      qualityIndex: 0,
      activeMinutes: 0,
      actions: [],
      recentActivity: [],
      qualitySamples: [] as number[],
    };
    statsMap.set(userId, initial);
    return initial;
  };

  const addAction = (userId: string, type: string, score: number, title: string, date: any) => {
    const s = getStats(userId);
    s.totalScore += score;
    const existing = s.actions.find((a) => a.type === type);
    if (existing) {
      existing.count += 1;
      existing.score += score;
    } else {
      s.actions.push({ type, count: 1, score });
    }
    if (s.recentActivity.length < 8) {
      s.recentActivity.push({ type, title, date });
    }
  };

  activities?.forEach((a) => {
    const roiBonus = Math.max(0, Math.min(40, (a.finalRoi || 0) / 5));
    addAction(a.userId, 'ROI Activity', 80 + roiBonus, a.title, a.loggedAt);
  });

  checkins?.forEach((c) => addAction(c.userId, 'Check-in', 12, `Mission: ${c.primaryMission}`, c.timestamp));

  checkouts?.forEach((c) => {
    const q = scoreCheckoutQuality(c);
    const score = 20 + q * 0.6;
    const s = getStats(c.userId, c.name);
    s.qualitySamples.push(q);
    addAction(c.userId, 'Check-out', score, 'Daily Report Submitted', c.timestamp);
  });

  testimonies?.forEach((t) => addAction(t.userId, 'Testimony', 60, t.title, t.createdAt));
  expenses?.forEach((e) => addAction(e.userId, 'Expense Report', 8, e.title, e.createdAt));

  const checkoutsByUser = new Map<string, Checkout[]>();
  checkouts?.forEach((co) => {
    const list = checkoutsByUser.get(co.userId) || [];
    list.push(co);
    checkoutsByUser.set(co.userId, list);
  });

  checkins?.forEach((ci) => {
    const s = getStats(ci.userId, ci.name);
    const ciDate = ci.timestamp?.toDate?.();
    if (!ciDate) return;
    const nextCheckout = (checkoutsByUser.get(ci.userId) || [])
      .map((c) => c.timestamp?.toDate?.())
      .filter((d): d is Date => Boolean(d && d > ciDate))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    const end = nextCheckout || new Date();
    const minutes = Math.max(0, Math.min(16 * 60, Math.round((end.getTime() - ciDate.getTime()) / 60000)));
    s.activeMinutes += minutes;
  });

  return Array.from(statsMap.values())
    .map((u) => ({
      ...u,
      qualityIndex: u.qualitySamples.length
        ? Math.round(u.qualitySamples.reduce((sum, n) => sum + n, 0) / u.qualitySamples.length)
        : 0,
    }))
    .filter((u) => u.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .map(({ qualitySamples, ...rest }) => rest);
}
