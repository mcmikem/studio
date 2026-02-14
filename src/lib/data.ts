

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

export const roleKpis: Record<string, { title: string, description: string }[]> = {
  'Executive Director': [
    { title: 'Strategic Alignment', description: 'Ensure all team activities align with quarterly Key Results.' },
    { title: 'Financial Health', description: 'Maintain a positive cash flow and approve mission-critical expenses within 48 hours.' },
    { title: 'Team Performance', description: 'Maintain a team-wide coordination score of 4.0+ in weekly surveys.' },
    { title: 'High-Level Partnerships', description: 'Secure at least one new strategic partnership or funding opportunity per month.' },
  ],
  'Programs & Partnerships Manager': [
    { title: 'Program Health', description: 'Keep all managed programs in "On Track" status.' },
    { title: 'Partnership Pipeline', description: 'Move at least 2 partners from "Prospecting" to "Negotiation" each month.' },
    { title: 'Partner Engagement', description: 'Log at least 4 significant partner meetings or interactions per month.' },
    { title: 'Data-Driven Decisions', description: 'Use the Qualitative Analysis tool monthly to generate insights for program improvement.' },
  ],
  'Operations & Field Manager': [
    { title: 'Field Activity Velocity', description: 'Ensure the team logs at least 15 field activities per week.' },
    { title: 'Resource Management', description: 'Maintain 100% accuracy in the equipment inventory.' },
    { title: 'Team Deployment', description: 'Ensure 90% of the team has a published weekly workplan by Monday morning.' },
    { title: 'Financial Prudence', description: 'Keep project expenses within 10% of their allocated budgets.' },
  ],
  'Media & Finance Lead': [
    { title: 'Financial Accuracy', description: 'Reconcile the financial ledger weekly and ensure all transactions are categorized.' },
    { title: 'Disbursement Speed', description: 'Process all "Approved" expenses for disbursement within 2 business days.' },
    { title: 'Content Pipeline', description: 'Generate at least 5 impact stories from logged activities or testimonies each month.' },
    { title: 'Audience Engagement', description: 'Publish at least 3 pieces of content to Omuto Pulse or social media per week.' },
  ],
   'Media & Communications Lead': [
    { title: 'Financial Accuracy', description: 'Reconcile the financial ledger weekly and ensure all transactions are categorized.' },
    { title: 'Disbursement Speed', description: 'Process all "Approved" expenses for disbursement within 2 business days.' },
    { title: 'Content Pipeline', description: 'Generate at least 5 impact stories from logged activities or testimonies each month.' },
    { title: 'Audience Engagement', description: 'Publish at least 3 pieces of content to Omuto Pulse or social media per week.' },
  ],
  'Resource Mobilization Lead': [
    { title: 'Grant Discovery', description: 'Identify and add at least 5 new potential grants to the tracker each week.' },
    { title: 'Proposal Submission', description: 'Submit at least 2 new grant proposals each month.' },
    { title: 'Funding Pipeline', description: 'Move at least one proposal from "Draft" to "Submitted" status each week.' },
    { title: 'Donor Communication', description: 'Log an interaction with at least 3 existing donors/partners each month.' },
  ],
  'Field Coordinator': [
    { title: 'Activity Reporting', description: 'Log a detailed activity report for every field visit within 24 hours.' },
    { title: 'ROI Data Quality', description: 'Ensure all activity logs have a final ROI calculated and include at least one narrative element (e.g., memorable moment).' },
    { title: 'Beneficiary Data', description: 'Register at least 10 new beneficiaries in the system each week.' },
    { title: 'Daily Check-in', description: 'Submit your AI-planned daily check-in before 10 AM every workday.' },
  ],
  'Intern': [
    { title: 'Daily Notes', description: 'Submit your end-of-day note every day you work.' },
    { title: 'Task Completion', description: 'Complete all assigned tasks in your "My Tasks" list by their due date.' },
    { title: 'Learning & Growth', description: 'Ask the AI Coach at least one question per day to learn about Omuto\'s work.' },
  ],
  'Volunteer': [
     { title: 'Daily Notes', description: 'Submit your end-of-day note every day you volunteer.' },
     { title: 'Learning & Growth', description: 'Use the AI Coach to understand the programs you are supporting.' },
  ],
  'Administrator': [
      { title: 'System Health', description: 'Ensure all users have the correct roles assigned.' },
      { title: 'Support', description: 'Address any system feedback or bug reports within 48 hours.' },
      { title: 'Data Integrity', description: 'Regularly review system data for completeness and accuracy.' },
  ]
};

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

    