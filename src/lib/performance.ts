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

export interface PerformanceDataFreshness {
  computedAt: string;
  windowDays: number;
  sources: {
    activities: number;
    checkins: number;
    checkouts: number;
    expenses: number;
    testimonies: number;
    users: number;
  };
}

export interface PerformanceResult {
  leaderboard: PerformanceUserSummary[];
  freshness: PerformanceDataFreshness;
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

  // First, deduplicate users by normalized name+role
  const userGroups = new Map<string, User[]>();
  users.forEach(user => {
    const normalizedName = (user.name || '').toLowerCase().trim();
    const normalizedRole = (user.role || '').toLowerCase().trim();
    const key = `${normalizedName}|||${normalizedRole}`;
    if (!userGroups.has(key)) {
      userGroups.set(key, []);
    }
    userGroups.get(key)!.push(user);
  });

  // Get all unique user IDs grouped by person
  const allUserIds = new Set<string>();
  const primaryUsers = new Map<string, { name: string; role: string; photoURL?: string }>();
  userGroups.forEach((groupUsers, key) => {
    const [name, role] = key.split('|||');
    const primaryUser = groupUsers[0];
    const keyForStats = `${name}|||${role}`;
    primaryUsers.set(keyForStats, {
      name: primaryUser.name || name,
      role: primaryUser.role || role,
      photoURL: primaryUser.photoURL
    });
    groupUsers.forEach(u => allUserIds.add(u.id));
  });

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

  // Now combine stats for users with same name+role
  const combinedStats = new Map<string, PerformanceUserSummary>();
  
  statsMap.forEach((stats, userId) => {
    const normalizedName = (stats.name || '').toLowerCase().trim();
    const normalizedRole = (stats.role || '').toLowerCase().trim();
    const key = `${normalizedName}|||${normalizedRole}`;
    
    if (combinedStats.has(key)) {
      const existing = combinedStats.get(key)!;
      existing.totalScore += stats.totalScore;
      existing.activeMinutes += stats.activeMinutes;
      existing.qualityIndex = Math.round((existing.qualityIndex + stats.qualityIndex) / 2);
      // Merge actions
      stats.actions.forEach(action => {
        const existingAction = existing.actions.find(a => a.type === action.type);
        if (existingAction) {
          existingAction.count += action.count;
          existingAction.score += action.score;
        } else {
          existing.actions.push({ ...action });
        }
      });
    } else {
      combinedStats.set(key, {
        userId: stats.userId,
        name: stats.name,
        photoURL: stats.photoURL,
        role: stats.role,
        totalScore: stats.totalScore,
        qualityIndex: stats.qualityIndex,
        activeMinutes: stats.activeMinutes,
        actions: [...stats.actions],
        recentActivity: [...stats.recentActivity]
      });
    }
  });

  return Array.from(combinedStats.values())
    .filter((u) => u.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function buildPerformanceResult(params: {
  users: User[] | null;
  activities: Activity[] | null;
  checkins: Checkin[] | null;
  checkouts: Checkout[] | null;
  expenses?: Expense[] | null;
  testimonies?: Testimony[] | null;
}): PerformanceResult {
  const leaderboard = buildPerformanceSummary(params);
  const freshness: PerformanceDataFreshness = {
    computedAt: new Date().toISOString(),
    windowDays: 30,
    sources: {
      activities: params.activities?.length ?? 0,
      checkins: params.checkins?.length ?? 0,
      checkouts: params.checkouts?.length ?? 0,
      expenses: params.expenses?.length ?? 0,
      testimonies: params.testimonies?.length ?? 0,
      users: params.users?.length ?? 0,
    },
  };
  return { leaderboard, freshness };
}
