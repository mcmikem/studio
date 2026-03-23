'use client';

import type {
  OmutoAIInput,
  OmutoAIOutput,
  ImpactStoryInput,
  ImpactStoryOutput,
  StrategicAdvisorInput,
  StrategicAdvisorOutput,
  TestimonyInput,
  TestimonyOutput,
  ParsePlanInput,
  ParsePlanOutput,
  ParseWorkplanInput,
  ParseWorkplanOutput,
  ReceiptOCRInput,
  ReceiptOCROutput,
} from '@/lib/types';

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

// --- Omuto AI Chat ---
export function offlineOmutoAI(input: OmutoAIInput): OmutoAIOutput {
  const q = (input.question || '').toLowerCase();

  if (q.includes('help') || q.includes('what can you do')) {
    return {
      answer: `I'm Omuto AI — your assistant for planning, reporting, and team coordination.\n\n**While offline, I can help with:**\n- Daily planning guidance\n- Report writing tips\n- Field operation checklists\n- Foundation info (Ecosystem Model, programs)\n\nFor live data queries, please reconnect and try again.`
    };
  }

  if (q.includes('ecosystem') || q.includes('model')) {
    return {
      answer: `**Omuto's Ecosystem Model:**\n\n1. **Identify & Inspire** — Community outreach, school programs, talent discovery\n2. **Equip & Empower** — Skills training (YOSkills), mentorship, seed grants\n3. **Activate & Sustain** — Impact tracking, alumni network, enterprise support\n\nEach program maps to one or more phases. This model drives all our interventions.`
    };
  }

  if (q.includes('program') || q.includes('what do you do')) {
    return {
      answer: `**Omuto Foundation Programs:**\n- **School Xperience (SX)** — School leadership & impact tracking\n- **YOSkills** — Youth entrepreneurship & innovation\n- **YAP** — Youth Action Program with seed grants\n- **OFA** — Football Academy for talent development\n- **SLF** — School Leadership Forum\n- **GreenSchools** — Environmental clubs & tree planting\n- **PureWater** — WASH assessments & water mapping\n- **RED Campaign** — Menstrual health & education\n- **Essentials** — Social enterprise (products, sales, inventory)`
    };
  }

  if (q.includes('report') || q.includes('write') || q.includes('template')) {
    return {
      answer: `**Quick Report Template:**\n\n**Activity:** [What was done]\n**Date:** [When]\n**Location:** [Where]\n**Participants:** [Who attended]\n**Outcome:** [What was achieved]\n**Challenges:** [What went wrong]\n**Next Steps:** [What's next]\n**Memorable Moment:** [Highlight quote/story]\n\nTip: Use the Activity Report form for structured submissions with ROI tracking.`
    };
  }

  return {
    answer: `I'm currently working offline. Your question has been noted — please reconnect and try again for a full AI-powered response.\n\n**Quick tips while offline:**\n- Check-in/out forms work offline\n- All data entry forms save locally\n- Your data syncs automatically when back online`
  };
}

// --- Impact Story Generator ---
export function offlineGenerateImpactStory(input: ImpactStoryInput): ImpactStoryOutput {
  const activityName = input.activityName || 'Community Activity';
  const description = input.activityDescription || '';
  const impact = input.activityImpact || '';
  const member = input.userName || 'Team Member';
  const moment = input.memorableMoment || '';
  const quote = input.userQuote || '';

  let story = `**${activityName}**\n\n`;
  story += `Through the dedication of ${member}, ${activityName.toLowerCase()} brought meaningful change to our community. `;

  if (description) {
    story += `${description} `;
  }

  if (impact) {
    story += `\n\n**Impact:** ${impact}`;
  }

  if (moment) {
    story += `\n\n*"${moment}"*`;
  }

  if (quote) {
    story += `\n\n> ${quote}`;
  }

  story += `\n\nThis is the power of youth-led action. One activity, one moment, one step closer to the change we envision.`;

  return { impactStory: story };
}

// --- Strategic Advisor ---
export function offlineStrategicAdvisor(input: StrategicAdvisorInput): StrategicAdvisorOutput {
  const activities = input.activities || [];
  const checkins = input.checkins || [];
  const expenses = input.expenses || [];
  const keyResults = input.keyResults || [];

  const insights: { emoji: string; title: string; description: string; recommendation: string }[] = [];

  if (activities.length === 0 && checkins.length === 0) {
    insights.push({
      emoji: '📋',
      title: 'Data Collection Needed',
      description: 'No recent activities or check-ins found in the last 30 days.',
      recommendation: 'Start logging daily activities and check-ins to enable trend analysis.'
    });
  }

  if (activities.length > 0) {
    const recent = activities.slice(-5);
    insights.push({
      emoji: '📊',
      title: 'Activity Summary',
      description: `${activities.length} activities logged in the last 30 days. Most recent: "${recent[recent.length - 1]?.title || 'Unknown'}".`,
      recommendation: 'Review activity-to-impact ratios to optimize resource allocation.'
    });
  }

  if (checkins.length > 0) {
    insights.push({
      emoji: '✅',
      title: 'Team Engagement',
      description: `${checkins.length} check-ins recorded, showing active team participation.`,
      recommendation: 'Continue daily check-ins to maintain accountability and track team morale.'
    });
  }

  if (expenses.length > 0) {
    const total = expenses.reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);
    insights.push({
      emoji: '💰',
      title: 'Expense Overview',
      description: `${expenses.length} expense reports totalling UGX ${total.toLocaleString()}.`,
      recommendation: 'Cross-reference expenses with activity outcomes for ROI analysis.'
    });
  }

  if (keyResults.length > 0) {
    const behind = keyResults.filter((kr: any) => {
      const progress = kr.currentProgress || 0;
      const target = kr.target || 1;
      return (progress / target) < 0.5;
    });
    if (behind.length > 0) {
      insights.push({
        emoji: '⚠️',
        title: 'Key Results Behind Schedule',
        description: `${behind.length} of ${keyResults.length} key results are below 50% progress.`,
        recommendation: 'Prioritize interventions for underperforming key results this week.'
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      emoji: '📈',
      title: 'Offline Analysis',
      description: 'AI-powered insights are unavailable offline. Showing cached data summary.',
      recommendation: 'Reconnect for detailed AI analysis of your data trends.'
    });
  }

  return { insights };
}

// --- Enterprise Advisor ---
export function offlineEnterpriseAdvisor(input: { sales: any[]; inventory: any[]; production: any[] }) {
  const { sales, inventory, production } = input;
  const insights: { title: string; insight: string; priority: 'Low' | 'Medium' | 'High'; actionableStep: string }[] = [];

  if (inventory.length > 0) {
    const lowStock = inventory.filter((p: any) => {
      const qty = p.quantity_on_hand ?? p.current_stock_quantity ?? 0;
      return qty < 10;
    });
    if (lowStock.length > 0) {
      insights.push({
        title: 'Low Stock Alert',
        insight: `${lowStock.length} product(s) have fewer than 10 units in stock.`,
        priority: 'High' as const,
        actionableStep: `Reorder: ${lowStock.map((p: any) => p.name).join(', ')}`
      });
    }
  }

  if (sales.length > 0) {
    const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    insights.push({
      title: 'Sales Summary',
      insight: `${sales.length} sales totalling UGX ${totalRevenue.toLocaleString()}.`,
      priority: 'Medium' as const,
      actionableStep: 'Review top-selling products for production planning.'
    });
  }

  if (production.length > 0) {
    insights.push({
      title: 'Production Activity',
      insight: `${production.length} production batches recorded.`,
      priority: 'Low' as const,
      actionableStep: 'Compare production output against sales demand.'
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: 'No Data Available',
      insight: 'Enterprise data not yet recorded.',
      priority: 'Low' as const,
      actionableStep: 'Start logging sales, inventory, and production to enable analysis.'
    });
  }

  return { insights };
}

// --- Testimony Processor ---
export function offlineProcessTestimony(input: TestimonyInput): TestimonyOutput {
  const transcription = input.transcription || '';

  const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summary = sentences.length > 0
    ? sentences.slice(0, 3).join('. ').trim() + '.'
    : 'Transcription received. AI analysis pending reconnection.';

  const quotes: string[] = [];
  const quotePatterns = transcription.match(/["""]([^"""]+)["""]/g);
  if (quotePatterns) {
    quotes.push(...quotePatterns.slice(0, 3));
  }

  const hashtags = ['#OmutoFoundation', '#YouthLedChange', '#ImpactStory'];

  return {
    transcription,
    summary,
    quotes,
    hashtags
  };
}

// --- Receipt OCR ---
export function offlineProcessReceipt(_input: ReceiptOCRInput): ReceiptOCROutput {
  return {
    title: 'Receipt (Offline — manual entry required)',
    items: [],
    totalAmount: 0,
    currency: 'UGX'
  };
}

// --- Grant Writer ---
export function offlineWriteConceptNote(input: { partnerName: string; proposalTitle: string; amountRequested: string | number }) {
  const { partnerName, proposalTitle, amountRequested } = input;

  const conceptNote = `## Concept Note: ${proposalTitle}

### Introduction
Omuto Foundation is a youth-led NGO based in rural Uganda, committed to transforming communities through our three-phase Ecosystem Model: **Identify & Inspire**, **Equip & Empower**, and **Activate & Sustain**.

### Problem Statement
Young people in rural Uganda face limited access to quality education, mentorship, and economic opportunities. Without intervention, this leads to unemployment, disengagement, and untapped potential.

### Our Proven Solution
Through ${proposalTitle}, we will leverage our established programs to create measurable impact:
- **Identify & Inspire:** Community outreach and school engagement to identify youth potential
- **Equip & Empower:** Skills training, mentorship, and resource provision
- **Activate & Sustain:** Ongoing support, alumni networks, and enterprise development

### Budget Overview
We are requesting **${amountRequested} UGX** from **${partnerName}** to implement this initiative over 12 months.

| Category | Allocation |
|----------|-----------|
| Program Delivery | 45% |
| Personnel | 25% |
| Materials & Equipment | 15% |
| Monitoring & Evaluation | 10% |
| Administration | 5% |

---
*Note: This is a draft template. Reconnect for AI-enhanced content.*`;

  return { conceptNote };
}

// --- Qualitative Analysis ---
export function offlineQualitativeAnalysis(input: { programName: string; data?: any[] }) {
  const data = input.data || [];

  return {
    summary: `${data.length} records found for ${input.programName}. Detailed AI analysis requires an internet connection.`,
    recurringSuccesses: data.length > 0
      ? ['Activity logging is consistent', 'Field teams are actively recording data']
      : [],
    commonChallenges: data.length === 0
      ? ['No data available for analysis']
      : [],
    keyLearnings: [
      'Continue collecting structured data to enable deeper analysis when online.',
      'Review individual records for manual insights.'
    ]
  };
}

// --- Parse Operational Plan ---
export function offlineParseOperationalPlan(input: ParsePlanInput): ParsePlanOutput {
  const text = input.planText || '';
  const lines = text.split('\n').filter(l => l.trim().length > 5);

  const keyResults = lines
    .filter(l => /\d+/.test(l))
    .slice(0, 10)
    .map((line, i) => {
      const numMatch = line.match(/(\d+)/);
      const target = numMatch ? parseInt(numMatch[1]) : 0;

      return {
        title: line.trim().substring(0, 100),
        description: `Extracted from operational plan (line ${i + 1})`,
        target,
        unit: '',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'Medium' as const,
        currentProgress: 0,
        current: 0,
      };
    });

  return { keyResults };
}

// --- Parse Workplan ---
export function offlineParseWorkplan(input: ParseWorkplanInput): ParseWorkplanOutput {
  const text = input.textPlan || '';
  const lines = text.split('\n').filter(l => l.trim().length > 3);

  const priorities = lines.slice(0, 10).map(line => line.trim());

  return {
    keyPriorities: priorities,
    message: `Parsed ${priorities.length} items from your workplan. Reconnect for AI-enhanced parsing.`
  };
}

// --- Wrapper: Call AI with offline detection ---
export async function callAIOfflineFirst<T>(
  serverAction: () => Promise<T>,
  offlineFallback: () => T
): Promise<T> {
  if (isOffline()) {
    return offlineFallback();
  }
  try {
    return await serverAction();
  } catch (error) {
    if (isOffline()) {
      return offlineFallback();
    }
    throw error;
  }
}
