

import { PlanGoal, TeamMemberRole, SuccessMetric, CalendarEvent, StatCard, KeyResult, User, Program, Partnership, Project, ImpactMetric, Alert, TeamWeeklyPlan, Expense, Income, TaskTemplate } from './types';
import { AlertTriangle, Info } from 'lucide-react';
import { startOfWeek, setDate } from 'date-fns';
import { Timestamp } from 'firebase/firestore';


export const KNOWLEDGE_BASE = `# **OMUTO FOUNDATION - NOVEMBER 2025 REALITY-BASED LOGICAL FRAMEWORK**
**"Complete, Launch, Prepare"**

---

## **1. STRATEGIC OBJECTIVES MATRIX**

| Hierarchy | Description | Key Results & Indicators | Means of Verification | Critical Assumptions |
|-----------|-------------|--------------------------|---------------------|---------------------|
| **Goal** | **Foundation Building** - Complete October backlogs, launch sustainable initiatives, and prepare for December scale | • 100% October backlog clearance<br>• 2 new initiatives successfully launched<br>• Team coordination score 4.0+<br>• December ready with proven systems | • Backlog completion reports<br>• Launch success metrics<br>• Weekly coordination surveys<br>• December detailed plan | • Team can focus on completion vs new initiatives<br>• Quality standards can be maintained<br>• Market responds positively to products |
| **Strategic Objectives** | **1. Clear October Backlogs** - Complete all carry-over tasks with quality<br>**2. Launch Omuto Essentials** - Establish product business with market validation<br>**3. Secure OFA Foundation** - Build partnership base for December launch<br>**4. Achieve Operational Basics** - 100% Omuto Central adoption + team coordination | **KR1:** Tree planting completed + documentary finished + data documented<br>**KR2:** 50+ products sold with 85% customer satisfaction<br>**KR3:** 3 partnership commitments with signed MOUs<br>**KR4:** 100% app adoption + coordination score 4.0+ | • Tree planting reports + final video<br>• Sales records + customer feedback<br>• Partnership database + MOUs<br>• App analytics + team surveys | • Backlogs can be completed in Week 1<br>• Products meet quality standards<br>• Partners see mutual value proposition<br>• Team adapts to new systems |

---

## **2. INTEGRATED ACTIVITY FRAMEWORK**

### **WEEK 1 (Nov 3-7): BACKLOG CLEARANCE & FOUNDATION**
*Theme: "Finish What We Started"*

| Priority | Activities | Responsible | Key Outputs | Success Verification |
|----------|------------|-------------|-------------|---------------------|
| **Backlog Clearance** | • Complete 510 tree planting<br>• Finalize Dignity Pads production<br>• Install sewing machine at COD site | Kasirye (70%)<br>Zam (production)<br>Diana (coordination) | • Trees planted with survival plan<br>• 100 pads produced, quality tested<br>• Machine operational with trained users | • Photos + report in Omuto Central<br>• Quality test results<br>• Training completion records |
| **Documentary Completion** | • Finalize RED Campaign filming<br>• Complete editing<br>• Publish final video | Alex + Jimmy (100% focus) | • 3-min documentary ready<br>• Social media promotion<br>• Impact stories captured | • Video file in Omuto Central<br>• Publishing metrics<br>• Beneficiary consent forms |
| **App Adoption Launch** | • Train all team on Omuto Central<br>• Migrate all reporting to app<br>• Establish check-in protocol | McMike (enforcement)<br>All Team (compliance) | • 100% team using app<br>• All check-ins via app<br>• Finance tracking active | • App usage reports<br>• Check-in compliance data<br>• Financial records accuracy |

### **WEEK 2 (Nov 10-14): PRODUCT LAUNCH & PARTNERSHIP START**
*Theme: "Market Entry & Relationship Building"*

| Priority | Activities | Responsible | Key Outputs | Success Verification |
|----------|------------|-------------|-------------|---------------------|
| **Omuto Essentials Launch** | • Establish 3 sales channels<br>• Launch marketing campaign<br>• Collect customer feedback | Kasirye (60%)<br>Alex (marketing support)<br>All Team (promotion) | • Products in market<br>• Initial sales achieved<br>• Customer feedback system | • Sales records in app<br>• Channel agreements<br>• Customer testimonials |
| **OFA Partnership Outreach** | • Identify 15 potential partners<br>• Develop partnership package<br>• Conduct 3 exploratory meetings | Diana (80%)<br>McMike (high-level meetings) | • Qualified partner list<br>• Customized proposals<br>• Meeting commitments | • Outreach logs in app<br>• Proposal documents<br>• Meeting minutes |
| **Team Coordination** | • Implement daily check-in system<br>• Weekly priority alignment<br>• Blocker resolution | All Team (compliance)<br>McMike (facilitation) | • Smooth coordination<br>• Clear weekly priorities<br>• Quick problem-solving | • Coordination score 4.0+<br>• Weekly goal achievement<br>• Reduced misunderstandings |

### **WEEK 3 (Nov 17-21): MOMENTUM & VALIDATION**
*Theme: "Proof of Concept"*

| Priority | Activities | Responsible | Key Outputs | Success Verification |
|----------|------------|-------------|-------------|---------------------|
| **Product Business Validation** | • Analyze sales data<br>• Optimize production<br>• Scale successful channels | Kasirye (70%)<br>Diana (customer feedback) | • Sales trends identified<br>• Production improvements<br>• Channel performance data | • Sales analysis report<br>• Process improvements<br>• Revenue projections |
| **Partnership Commitment** | • Finalize MOU drafts<br>• Secure 3 commitments<br>• Plan December activation | Diana (80%)<br>McMike (approvals) | • Signed MOUs<br>• Resource commitments<br>• Launch timeline | • MOU copies in app<br>• Partner confirmations<br>• Activation plan |
| **Communications Maintenance** | • Social media consistency<br>• Documentary promotion<br>• Impact storytelling | Alex + Jimmy (30% time) | • Steady audience engagement<br>• Documentary views<br>• Program awareness | • Engagement metrics<br>• Viewership numbers<br>• Community feedback |

### **WEEK 4 (Nov 24-28): CONSOLIDATION & DECEMBER PREP**
*Theme: "Learning and Scaling"*

| Priority | Activities | Responsible | Key Outputs | Success Verification |
|----------|------------|-------------|-------------|---------------------|
| **Monthly Review & Learning** | • Analyze November performance<br>• Document successes/failures<br>• Identify improvements | All Team (input)<br>McMike (synthesis) | • November success report<br>• Lessons learned document<br>• Process improvements | • Monthly report in app<br>• Improvement initiatives<br>• Team feedback |
| **December Planning** | • Detailed OFA launch plan<br>• Product scaling strategy<br>• Resource allocation | Diana (OFA plan)<br>Kasirye (production plan)<br>McMike (integration) | • Actionable December plan<br>• Clear targets and timelines<br>• Budget and resources aligned | • December plan document<br>• Role assignments<br>• Budget approval |
| **Systems Reinforcement** | • App usage optimization<br>• Coordination protocol refinement<br>• Capacity assessment | McMike (systems)<br>All Team (feedback) | • Efficient workflows<br>• Reduced friction<br>• Realistic capacity planning | • System efficiency metrics<br>• Team satisfaction<br>• December capacity model |

---

## **3. INDIVIDUAL ACCOUNTABILITY & CAPACITY**

### **Kasirye (Operations Manager)**
**Primary Focus (70%):** Product Business & Backlog Clearance
- Week 1: Tree planting + pads production + machine installation
- Week 2: Product launch + sales channel setup
- Week 3: Sales optimization + production scaling
- Week 4: Business analysis + December planning

**Secondary (30%):** Field operations + data collection in Omuto Central

### **Diana (Programs Manager)**
**Primary Focus (70%):** Partnerships & Backlog Coordination
- Week 1: Backlog coordination + sewing machine setup
- Week 2: Partner identification + outreach
- Week 3: MOU development + commitment securing
- Week 4: December OFA launch planning

**Secondary (30%):** Customer feedback + communications support

### **Alex (Media Lead)**
**Primary Focus (60%):** Documentary Completion & Communications
- Week 1: Documentary finalization and publishing
- Week 2-4: Maintenance mode - consistent social media presence

**Secondary (40%):** Product marketing support + impact storytelling

### **Jimmy (Media Officer)**
**Primary Focus (80%):** Production Quality & Technical Support
- Week 1: Documentary editing and finishing
- Week 2-4: Technical support + content creation

**Secondary (20%):** Equipment management + platform optimization

### **McMike (Executive Director)**
**Primary Focus:** Priority Protection & Quality Assurance
- Week 1: App adoption enforcement + backlog completion
- Week 2: Partnership high-level meetings + product quality
- Week 3: Strategic decisions + coordination oversight
- Week 4: Monthly synthesis + December strategy

---

## **4. SUCCESS METRICS & PROGRESS TRACKING**

### **Weekly Health Dashboard**
| Metric | Week 1 Target | Week 2 Target | Week 3 Target | Week 4 Target |
|--------|---------------|---------------|---------------|---------------|
| **Backlog Completion** | 100% | N/A | N/A | N/A |
| **Product Sales** | N/A | 15 units | 30 units | 50+ units |
| **Partnership Progress** | N/A | 3 meetings | 2 commitments | 3 commitments |
| **App Adoption** | 100% | 100% | 100% | 100% |
| **Team Coordination** | 4.0+ | 4.0+ | 4.0+ | 4.5+ |

### **Quality Gates (Must Pass to Proceed)**
- **Week 1 Gate:** All backlogs cleared + app adoption achieved
- **Week 2 Gate:** Products launched + partner outreach completed
- **Week 3 Gate:** Sales momentum + partnership commitments
- **Week 4 Gate:** December plan ready + team energized

---

## **5. RISK MANAGEMENT & CONTINGENCY**

| Risk Scenario | Mitigation Strategy | Trigger for Action | Contingency Plan |
|---------------|---------------------|-------------------|------------------|
| **Backlogs not cleared Week 1** | Daily progress tracking, reallocate resources | Day 3 behind schedule | Extend to Day 5, protect Week 2 priorities |
| **Product quality issues** | Batch testing, customer feedback loops | Any quality complaints | Immediate production halt, root cause analysis |
| **Low partner response** | Diverse outreach, existing network leverage | Week 2: <2 meetings | Expand prospect list, adjust value proposition |
| **Team coordination breakdown** | Daily check-ins, clear priorities, quick conflict resolution | Coordination score <4.0 | Emergency team meeting, simplify processes |
| **App adoption resistance** | Training, leadership modeling, technical support | Day 2: <80% compliance | One-on-one coaching, simplify requirements |

---

## **6. RESOURCE ALLOCATION & BUDGET**

| Category | Allocation (UGX) | Specific Use | Accountability |
|----------|------------------|-------------|---------------|
| **Backlog Completion** | 200,000 | Tree planting materials, sewing machine setup, documentary finishing | Kasirye + Diana |
| **Product Launch** | 400,000 | Production materials, packaging, marketing, sales channels | Kasirye |
| **Partnership Development** | 250,000 | Meeting costs, materials development, communication | Diana |
| **Operational Systems** | 100,000 | App support, training materials, coordination tools | McMike |
| **Contingency** | 50,000 | Unexpected opportunities, emergency needs | McMike |
| **TOTAL** | **1,000,000** | | |

---

## **7. DEFINITION OF SUCCESS**

**November 2025 is successful when:**
- ✅ October backlogs are 100% completed with quality
- ✅ Omuto Essentials is generating revenue with happy customers
- ✅ OFA has committed partners ready for December launch
- ✅ Team works cohesively using Omuto Central consistently
- ✅ December plan is detailed and achievable

**November is NOT successful if:**
- ❌ We start December with new backlogs
- ❌ Product quality is compromised for speed
- ❌ Partnerships are rushed and unsustainable
- ❌ Team is burned out and coordination is poor
- ❌ December planning is vague and unrealistic
`;


export const tagColors: { [key: string]: string } = {
    '#FieldVisit': 'border-blue-500 bg-blue-500/10 text-blue-500',
    '#Media': 'border-purple-500 bg-purple-500/10 text-purple-500',
    '#Programs': 'border-green-500 bg-green-500/10 text-green-500',
    '#FieldWork': 'border-orange-500 bg-orange-500/10 text-orange-500',
    '#Approval': 'border-teal-500 bg-teal-500/10 text-teal-500',
    '#Finance': 'border-pink-500 bg-pink-500/10 text-pink-500',
    '#Update': 'border-gray-500 bg-gray-500/10 text-gray-500',
    '#Fundraising': 'border-red-500 bg-red-500/10 text-red-500',
    '#Partnerships': 'border-indigo-500 bg-indigo-500/10 text-indigo-500',
};

export const quickStats: Omit<StatCard, 'icon'>[] = [
    { title: 'Active Schools', value: '12' },
    { title: 'Students Engaged', value: '1,250' },
    { title: 'Projects Running', value: '3' },
    { title: 'Events this Month', value: '6' },
    { title: 'Funds Raised (Cycle of Dignity)', value: 'UGX 1.2M / 2M', change: '60% of target' },
    { title: 'New Media Uploads', value: '5 stories' },
];

export const nonNegotiableGoals: PlanGoal[] = [
    {
        title: "Clear October Backlogs",
        description: "Complete all carry-over tasks with quality.",
        details: "Tree planting, documentary finishing, data documentation."
    },
    {
        title: "Launch Omuto Essentials",
        description: "Establish product business with market validation.",
        details: "50+ products sold with 85% customer satisfaction."
    },
     {
        title: "Secure OFA Foundation",
        description: "Build partnership base for December launch.",
        details: "3 partnership commitments with signed MOUs."
    },
];

export const flexibleTargets: PlanGoal[] = [
    { title: "Achieve Operational Basics", description: "100% Omuto Central adoption + team coordination.", details: "" },
];

export const sampleUsers: Omit<User, 'id'>[] = [
    { name: 'McMike Mutumba', email: 'mcmike@omuto.org', role: 'Executive Director' },
    { name: 'Dianah Nansikombi', email: 'programs@omuto.org', role: 'Programs & Partnerships Manager' },
    { name: 'Kasirye Constantine', email: 'operations@omuto.org', role: 'Operations & Field Manager' },
    { name: 'Nsereko Alex', email: 'alex@omuto.org', role: 'Media & Finance Lead' },
    { name: 'Bwire Bashir', email: 'bashir@omuto.org', role: 'Field Coordinator' },
    { name: 'John Paul Akera', email: 'akera@omuto.org', role: 'Resource Mobilization Lead' },
    { name: 'Omuto General', email: 'info@omuto.org', role: 'Administrator' },
];

export const samplePrograms: Omit<Program, 'id' | 'createdAt'>[] = [
    { title: 'RED Campaign', description: 'Menstrual Health Management education and support.', lead: 'Dianah Nansikombi', status: 'On Track', deadline: '2025-12-31', objectives: ['Deliver sessions to 200 parents and 50 teachers', 'Reach 600 girls with MHM kits'], valuePerObjective: 50000 },
    { title: 'GreenSchools Campaign', description: 'Environmental conservation through school-based activities.', lead: 'Kasirye Constantine', status: 'At Risk', deadline: '2025-11-30', objectives: ['Plant 700 trees', 'Establish 10 student Green Teams'], valuePerObjective: 20000 },
    { title: 'YoSkills Entrepreneurship', description: 'Vocational and business training for youth.', lead: 'Dianah Nansikombi', status: 'On Track', deadline: '2026-01-31', objectives: ['Train 50 youth in soap-making', 'Launch 5 new youth-led enterprises'], valuePerObjective: 75000 },
];

export const samplePartnerships: Omit<Partnership, 'id' | 'createdAt'>[] = [
    { name: 'Spouts of Water', contactPerson: 'Daniel Yin', contactEmail: 'daniel@spouts.org', status: 'Active', nextStep: 'Co-design PureWater Initiative Phase 2' },
    { name: 'MHAMIA Foundation', contactPerson: 'Sarah Nakka', contactEmail: 'sarah.n@mhamia.org', status: 'Active', nextStep: 'Joint training session at Mpigi Secondary' },
    { name: 'Mpigi District Local Government', contactPerson: 'Mr. Bwekembe', contactEmail: 'cao.mpigi@lg.go.ug', status: 'Active', nextStep: 'Align on Q4 youth programs' },
    { name: 'GlobalGiving', contactPerson: 'Regional Manager', contactEmail: 'africa@globalgiving.org', status: 'Prospecting', nextStep: 'Submit final report for Cycle of Dignity' },
];

export const sampleProjects: Omit<Project, 'id' | 'createdAt'>[] = [
    { name: 'RED Campaign School Tour (Mpigi)', manager: 'Dianah Nansikombi', districts: 'Mpigi', status: 'Active', completion: 65, nextMilestone: 'Sign MoU with Nindye SS' },
    { name: 'GreenSchools Butambala Launch', manager: 'Bwire Bashir', districts: 'Butambala', status: 'Active', completion: 20, nextMilestone: 'Recruit 5 volunteer facilitators' },
];

export const sampleImpactMetrics: Omit<ImpactMetric, 'id'>[] = [
    { metric: 'Girls Supported (RED)', target: 600, current: 520, unit: 'girls', valuePerUnit: 25000 },
    { metric: 'Trees Planted (GreenSchools)', target: 700, current: 190, unit: 'trees', valuePerUnit: 5000 },
    { metric: 'Cycle of Dignity Fundraising', target: 2000000, current: 800000, unit: 'UGX', valuePerUnit: 1 },
    { metric: 'Youth Reached', target: 1000, current: 247, unit: 'youth', valuePerUnit: 10000 },
];

export const sampleAlerts: Omit<Alert, 'id' | 'createdAt'>[] = [];

export const sampleCalendarEvents: Omit<CalendarEvent, 'id' | 'createdAt'>[] = [];


export const sampleTeamWeeklyPlans: Omit<TeamWeeklyPlan, 'id' | 'createdAt'>[] = [
  {
    weekOf: Timestamp.fromDate(startOfWeek(new Date('2025-10-13T12:00:00Z'), { weekStartsOn: 1 })),
    keyPriorities: [
      { activity: 'Submission of permit renewal files to NGO Bureau office', priority: 'High', responsible: ['Dianah Nansikombi'], deadline: '' },
      { activity: 'Host an orientation session about how to use Omuto Central.', priority: 'High', responsible: ['McMike Mutumba'], deadline: '' },
      { activity: 'Increase mobilization of funds for Cycle of Dignity Campaign', priority: 'High', responsible: ['All Members'], deadline: '' },
      { activity: 'Secure 3 PTA schools meeting for awareness of Red campaign', priority: 'Medium', responsible: ['Dianah Nansikombi'], deadline: '' },
      { activity: 'Secure 3 partnership meetings for programs support', priority: 'Medium', responsible: ['Dianah Nansikombi', 'Kasirye Constantine'], deadline: '' },
      { activity: 'Drafting new YAP Chapters SOPs', priority: 'Low', responsible: ['Dianah Nansikombi'], deadline: '' },
      { activity: 'Shoot a documentary for Red Campaign to be used for partnerships', priority: 'High', responsible: ['Nsereko Alex'], deadline: '' },
      { activity: 'Produce first prototype batch of 10 of Dignity pads.', priority: 'High', responsible: ['Kasirye Constantine'], deadline: '' },
      { activity: 'Complete field mapping for Mpigi,Butambala and Kampala', priority: 'Medium', responsible: ['Kasirye Constantine', 'Dianah Nansikombi'], deadline: '' },
      { activity: 'Schedule a stake holder consultation meeting for Omuto Football Gala', priority: 'Low', responsible: ['Kasirye Constantine'], deadline: '' },
      { activity: 'Draft 3 compelling stories about Menstrual Health management and Cycle of dignity campaign', priority: 'Medium', responsible: ['Nsereko Alex'], deadline: '' },
      { activity: 'Hold a weekly review meeting(goals vs achievements)', priority: 'High', responsible: ['All Members'], deadline: '' },
      { activity: 'Draft a detailed weekly report.', priority: 'Medium', responsible: ['Dianah Nansikombi'], deadline: '' },
      { activity: 'Draft a concept note for Omuto Football Gala', priority: 'Low', responsible: ['Dianah Nansikombi'], deadline: '' }
    ],
    message: 'This week, our focus is on executing these key priorities to advance our Q4 objectives. Let\'s ensure we are aligned, communicative, and supportive of each other to achieve these goals.',
    authorId: 'system-seed',
    authorName: 'Dianah Nansikombi',
    status: 'Published',
  }
];


export const sampleHistoricalIncome: Omit<Income, 'id' | 'createdAt'>[] = [
    { source: 'Member Donations', amount: 2552000, dateReceived: '2025-01-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 3003000, dateReceived: '2025-02-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 3139853, dateReceived: '2025-03-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 4687392, dateReceived: '2025-04-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 2878799, dateReceived: '2025-05-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 525550, dateReceived: '2025-06-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 2121448, dateReceived: '2025-07-15', type: 'Member Donations' },
    { source: 'Partnerships', amount: 945500, dateReceived: '2025-07-20', type: 'Partnerships' },
    { source: 'Imac Enterprises', amount: 140000, dateReceived: '2025-07-25', type: 'Imac Enterprises' },
    { source: 'Member Donations', amount: 504080, dateReceived: '2025-08-15', type: 'Member Donations' },
    { source: 'Imac Enterprises', amount: 70000, dateReceived: '2025-08-25', type: 'Imac Enterprises' },
    { source: 'Member Donations', amount: 505734, dateReceived: '2025-09-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 509855, dateReceived: '2025-10-15', type: 'Member Donations' },
];

export const sampleHistoricalExpenses: Omit<Expense, 'id' | 'createdAt'>[] = [
  { userId: 'system', userName: 'System Seed', date: '2025-01-20', title: 'Office Setup', type: 'Reimbursement', items: [{ description: 'Office Rent Q1', category: 'Rent', amount: 750000 }, { description: 'Internet Installation', category: 'Office Dev\'t', amount: 150000 }], totalAmount: 900000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-02-10', title: 'RED Campaign Launch', type: 'Requisition', items: [{ description: 'Transport to schools', category: 'Transport', amount: 200000 }, { description: 'Printing awareness materials', category: 'Printing & Photocopy', amount: 120000 }], totalAmount: 320000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-03-05', title: 'Monthly Staff Stipends', type: 'Requisition', items: [{ description: 'February Stipends', category: 'Allowances and stipends', amount: 1800000 }], totalAmount: 1800000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-04-18', title: 'GreenSchools Kickoff', type: 'Requisition', items: [{ description: 'Purchase of 200 seedlings', category: 'Projects', amount: 300000 }, { description: 'Fuel for project vehicle', category: 'Fuel', amount: 100000 }], totalAmount: 400000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-05-25', title: 'Partner Meeting - UNICEF', type: 'Reimbursement', items: [{ description: 'Meeting refreshments', category: 'Meetings', amount: 80000 }], totalAmount: 80000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-06-15', title: 'Office Supplies', type: 'Requisition', items: [{ description: 'Stationery and consumables', category: 'Stationery', amount: 250000 }], totalAmount: 250000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-07-30', title: 'Imac Enterprises Materials', type: 'Requisition', items: [{ description: 'Raw materials for soap production', category: 'IGA Expense', amount: 100000 }], totalAmount: 100000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-08-20', title: 'Butambala Field Visit', type: 'Reimbursement', items: [{ description: 'Transport for field coordinator', category: 'Transport', amount: 150000 }], totalAmount: 150000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-09-10', title: 'Media Team Content Day', type: 'Requisition', items: [{ description: 'Fuel and subject facilitation', category: 'Media', amount: 200000 }], totalAmount: 200000, status: 'Acknowledged' },
];

export const sampleTaskTemplates: Omit<TaskTemplate, 'id' | 'createdAt'>[] = [
  {
    title: 'Field Visit Preparation',
    checklistItems: [
      'Confirm appointment with school/community',
      'Prepare materials and equipment (e.g., posters, sign-in sheets)',
      'Check and confirm transport arrangements',
      'Brief volunteers/interns on their roles and responsibilities',
      'Charge all necessary devices (phones, cameras)',
      'Review field visit objectives and talking points',
    ],
  },
  {
    title: 'New Partnership Outreach',
    checklistItems: [
      'Research potential partner and identify alignment',
      'Identify the correct contact person',
      'Draft a personalized outreach email or message',
      'Prepare a one-page summary of Omuto Foundation\'s work',
      'Schedule a discovery call or meeting',
      'Log the new partner in the CRM with status "Prospecting"',
      'Set a follow-up reminder',
    ],
  },
];
    

    






    

