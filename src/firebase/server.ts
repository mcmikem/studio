

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';
import fs from 'fs';
import path from 'path';

// Function to get service account credentials
const getServiceAccount = () => {
  if (process.env.SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Error parsing SERVICE_ACCOUNT environment variable:', e);
    }
  }

  const serviceAccountPath = path.join(process.cwd(), 'secrets', 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    try {
      return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } catch (e) {
      console.error('Error reading or parsing service account key file:', e);
    }
  }

  return null;
};

const serviceAccount = getServiceAccount();

let adminApp: App | null = null;
let firestoreInstance: Firestore | null = null;
let isSeeding = false; 

// --- START OF SAMPLE DATA ---
const samplePrograms = [
    { title: 'RED Campaign', description: 'Menstrual Health Management education and support.', lead: 'Dianah Nansikombi', status: 'On Track', deadline: '2025-12-31', objectives: ['Deliver sessions to 200 parents and 50 teachers', 'Reach 600 girls with MHM kits'], valuePerObjective: 50000 },
    { title: 'GreenSchools Campaign', description: 'Environmental conservation through school-based activities.', lead: 'Kasirye Constantine', status: 'At Risk', deadline: '2025-11-30', objectives: ['Plant 700 trees', 'Establish 10 student Green Teams'], valuePerObjective: 20000 },
    { title: 'YoSkills Entrepreneurship', description: 'Vocational and business training for youth.', lead: 'Dianah Nansikombi', status: 'On Track', deadline: '2026-01-31', objectives: ['Train 50 youth in soap-making', 'Launch 5 new youth-led enterprises'], valuePerObjective: 75000 },
    { title: 'Omuto Football Alliance', description: 'Youth football league for talent development and community building.', lead: 'Kasirye Constantine', status: 'On Track', deadline: '2026-03-31', objectives: ['Register 12 teams', 'Host inaugural tournament'], valuePerObjective: 100000 },
];
const samplePartnerships = [
    { name: 'Spouts of Water', type: 'NGO', contactPerson: 'Daniel Yin', contactEmail: 'daniel@spouts.org', status: 'Active', nextStep: 'Co-design PureWater Initiative Phase 2' },
    { name: 'MHAMIA Foundation', type: 'NGO', contactPerson: 'Sarah Nakka', contactEmail: 'sarah.n@mhamia.org', status: 'Active', nextStep: 'Joint training session at Mpigi Secondary' },
    { name: 'Mpigi District Local Government', type: 'Government', contactPerson: 'Mr. Bwekembe', contactEmail: 'cao.mpigi@lg.go.ug', status: 'Active', nextStep: 'Align on Q4 youth programs' },
    { name: 'GlobalGiving', type: 'NGO', contactPerson: 'Regional Manager', contactEmail: 'africa@globalgiving.org', status: 'Prospecting', nextStep: 'Submit final report for Cycle of Dignity' },
];
const sampleProjects = [
    { name: 'Financial Literacy for Youth', manager: 'Dianah Nansikombi', districts: 'Mpigi, Butambala', status: 'Active', completion: 65, nextMilestone: 'Sign MoU with Nindye SS', partner: 'Stanbic Bank', participants: 50, attendanceRate: 88, learningImprovement: 45, adoptionRate: 62, startDate: '2025-12-01T00:00:00Z', endDate: '2026-05-31T00:00:00Z' },
    { name: 'GreenSchools Butambala Launch', manager: 'Bwire Bashir', districts: 'Butambala', status: 'Active', completion: 20, nextMilestone: 'Recruit 5 volunteer facilitators', partner: 'Jane Goodall Institute', participants: 150, attendanceRate: 92, learningImprovement: 0, adoptionRate: 0, startDate: '2025-10-01T00:00:00Z', endDate: '2026-02-28T00:00:00Z' },
];
const sampleImpactMetrics = [
    { metric: 'Girls Supported (RED)', target: 600, current: 520, unit: 'girls', valuePerUnit: 25000 },
    { metric: 'Trees Planted (GreenSchools)', target: 700, current: 190, unit: 'trees', valuePerUnit: 5000 },
    { metric: 'Cycle of Dignity Fundraising', target: 2000000, current: 800000, unit: 'UGX', valuePerUnit: 1 },
    { metric: 'Youth Reached', target: 1000, current: 247, unit: 'youth', valuePerUnit: 10000 },
];
const sampleKeyResults = [
    { title: 'NOV-KR1', description: 'Clear October Backlogs (tree planting, documentary, data)', currentProgress: 0, target: 100, deadline: '2025-11-07', priority: 'High' },
    { title: 'NOV-KR2', description: 'Launch Omuto Essentials & Sell 50+ Products', currentProgress: 0, target: 50, deadline: '2025-11-28', priority: 'High' },
    { title: 'NOV-KR3', description: 'Secure 3 OFA Partnership Commitments (MOUs)', currentProgress: 0, target: 3, deadline: '2025-11-21', priority: 'High' },
    { title: 'NOV-KR4', description: 'Achieve 100% Omuto Central Adoption & Coordination', currentProgress: 0, target: 100, deadline: '2025-11-28', priority: 'Medium' },
];
const sampleTaskTemplates = [
  { title: 'Field Visit Preparation', checklistItems: ['Confirm appointment with school/community', 'Prepare materials and equipment', 'Check transport arrangements', 'Brief volunteers on roles', 'Charge devices and cameras'] },
  { title: 'New Partnership Outreach', checklistItems: ['Research potential partner', 'Identify contact person', 'Draft outreach email', 'Schedule discovery call', 'Log partner in CRM'] },
];

const knowledgeHubContent = {
  sections: [
    { order: 1, title: 'Mission & Vision', summary: '<p><strong>Mission:</strong> To empower young people to learn, lead, and create sustainable change in their communities.</p><p><strong>Vision:</strong> A world where every young person has the skills, confidence, and opportunity to thrive and transform their community.</p><p>Omuto Foundation is a youth-led nonprofit based in Mpigi District, Uganda. We work with schools and communities to build youth leadership, entrepreneurship, education access, sports development, environmental conservation, and creative expression. Our approach is simple: young people are not just beneficiaries — they are leaders and solution-builders.</p>' },
    { order: 2, title: 'Quick Facts', summary: '<ul><li><strong>District:</strong> Mpigi</li><li><strong>Country:</strong> Uganda</li><li><strong>Type:</strong> Youth-led organization</li><li><strong>Primary beneficiaries:</strong> children, adolescents, and young people</li><li><strong>Key focus:</strong> schools, youth groups, sports teams, communities</li><li><strong>Current core team:</strong> Executive Director, Programs & Partnerships Manager, Operations & Field Manager, Media & Communications Lead</li><li><strong>Signature approach:</strong> leadership, practical skills, campaigns, community action</li><li><strong>Recent wins:</strong> planted over 1,300 trees, launched donor nursery beds, established youth entrepreneurship circles, trained student leaders, produced reusable dignity pads.</li></ul>' },
    { order: 3, title: 'Programs & Projects', summary: 'An overview of our key initiatives.', subsections: [ { title: 'Omuto Youth Project', summary: '<p>Equips young people with leadership, life skills, social action experience, and entrepreneurship capacity.</p><strong>Key components:</strong> Student Leaders Forum (SLF), RED Campaign, GreenSchools Campaign, PureWater Initiative, YoSkills Entrepreneurship Circles, Youth Action Pathway.' }, { title: 'Student Leaders Forum (SLF)', summary: '<p>Training platform for student leaders to drive school and community change. Includes RED Campaign, GreenSchools, and PureWater Initiative.</p>' }, { title: 'RED Campaign', summary: '<p>Supports menstrual health education, dignity, and confidence for girls.</p><strong>Impact Message:</strong> No girl should miss school because of her period.' }, { title: 'GreenSchools Campaign', summary: '<p>Greening schools to build greener communities and futures. Activities include tree planting, environmental clubs, and climate action training.</p><strong>Success Metric:</strong> 1,300+ trees planted and monitored.' }, { title: 'PureWater Initiative', summary: '<p>Promotes safe water, hygiene, and sanitation awareness among students.</p>'}, { title: 'YoSkills Entrepreneurship Circles', summary: '<p>Peer-based entrepreneurship and work-readiness learning spaces.</p>'}, { title: 'Youth Action Pathway', summary: '<p>Guides motivated youth from idea to full community social action project.</p>'}, { title: 'Omuto Talents Project (OFA & Omuto Pulse)', summary: '<p>Uses football and media to build discipline, leadership, and opportunity.</p>'}, { title: 'Omuto Essentials (Social Enterprise)', summary: '<p>Produces locally made youth-friendly products to support programs and create jobs (e.g., reusable dignity pads, soaps).</p>' } ] },
     { order: 5, title: 'Grant Boilerplates', summary: 'Standard paragraphs for grant proposals.', subsections: [ { title: 'Short Grant Paragraph', summary: 'Omuto Foundation is a youth-led nonprofit in Mpigi District, Uganda, working to empower young people through education, leadership development, entrepreneurship, sports, environmental conservation, and menstrual health support. We partner with schools and communities to create long-term, youth-driven change.'}, { title: 'Problem Statement Example', summary: 'Many young people in Mpigi face limited access to quality education, essential health information, economic opportunity, and safe learning environments. Youth have ideas and energy, but lack platforms, mentorship, and resources.'}, { title: 'Outcome Statement', summary: 'Young people gain confidence, leadership skills, entrepreneurship capacity, environmental awareness, and practical experience implementing real projects in their communities.'} ] }
  ],
  pitches: [
    { order: 1, title: '15-second pitch (youth audience)', summary: 'Omuto Foundation helps young people learn skills, lead projects, and change their communities — from tree planting and menstrual health to football and entrepreneurship.' },
    { order: 2, title: '30-second pitch (schools & partners)', summary: 'We are a youth-led nonprofit in Mpigi that trains student leaders, runs environmental and menstrual health campaigns, supports youth entrepreneurship, and uses sports and creative arts to engage young people. We work directly with schools and communities to build confidence, skills, and opportunity.'},
    { order: 3, title: '60-second pitch (donors & funders)', summary: 'Omuto Foundation empowers young people in Mpigi District with leadership development, entrepreneurship skills, sports programs, environmental action, and menstrual health support. Our programs include the Student Leaders Forum, GreenSchools Campaign, PureWater Initiative, YoSkills entrepreneurship circles, and Omuto Football Alliance. We combine training with real community action so youth are not passive beneficiaries but active solution-makers.'},
  ],
  faqs: [
    { order: 1, question: 'Who runs Omuto Foundation?', answer: 'A youth-led team based in Mpigi working with schools and communities.' },
    { order: 2, question: 'How can I volunteer?', answer: 'Register through Omuto Center app or contact the team.' },
    { order: 3, question: 'Do you only work in Mpigi?', answer: 'Our roots are in Mpigi but we collaborate widely where partnerships exist.' },
    { order: 4, question: 'Do you work with schools?', answer: 'Yes — schools are at the heart of our programs.' },
  ],
  stories: [
    { order: 1, title: "Aisha's Story (GreenSchools)", summary: 'Aisha used to think trees were just shade. After joining GreenSchools, she helped plant fruit trees at her school and now leads a group that waters and monitors them. She says, “I feel like I’m growing with the trees.”' },
    { order: 2, title: "Grace's Story (RED Campaign)", summary: 'Grace missed class because of her periods. After joining RED Campaign sessions and receiving reusable pads, she now attends fully and helps other girls learn hygiene with confidence.' },
    { order: 3, title: "Musa's Story (OFA)", summary: 'Musa joined Omuto Football Alliance to play. He stayed because he found mentorship, discipline, and teamwork. His new dream is to coach younger players.' },
  ],
  ctas: [
      { order: 1, title: 'Sponsor a School Nursery Bed', description: 'Help a school grow its own trees and food.', buttonLabel: 'Sponsor a Nursery Bed' },
      { order: 2, title: 'Support Dignity Kits', description: 'Provide reusable pads and MHM education to a girl.', buttonLabel: 'Support a Girl' },
      { order: 3, title: 'Partner with OFA', description: 'Support a local youth football team.', buttonLabel: 'Become a Partner' },
      { order: 4, title: 'Invite Omuto to Your School', description: 'Bring our leadership and skills programs to your students.', buttonLabel: 'Contact Us' },
      { order: 5, title: 'Volunteer or Mentor', description: 'Share your skills and experience with our youth.', buttonLabel: 'Get Involved' },
      { order: 6, title: 'Support Entrepreneurship', description: 'Help a youth circle start a small business.', buttonLabel: 'Support a Circle' },
  ]
};
// --- END OF SAMPLE DATA ---


async function seedDatabase(db: Firestore) {
  if (isSeeding) {
    console.log('Seeding is already in progress. Skipping.');
    return;
  }
  isSeeding = true;
  console.log('Checking if initial data seeding is needed...');

  try {
    const programsSnapshot = await db.collection('programs').limit(1).get();
    if (!programsSnapshot.empty) {
      console.log('Core data already exists. Skipping initial seed.');
      isSeeding = false;
      return;
    }

    console.log('Seeding all initial sample data...');
    const batch = db.batch();

    const collectionsToSeed = [
        { name: 'programs', data: samplePrograms },
        { name: 'partnerships', data: samplePartnerships },
        { name: 'key-results', data: sampleKeyResults },
        { name: 'projects', data: sampleProjects },
        { name: 'impact-metrics', data: sampleImpactMetrics },
        { name: 'task-templates', data: sampleTaskTemplates },
        { name: 'knowledgeHubSections', data: knowledgeHubContent.sections },
        { name: 'knowledgeHubPitches', data: knowledgeHubContent.pitches },
        { name: 'knowledgeHubFaqs', data: knowledgeHubContent.faqs },
        { name: 'knowledgeHubStories', data: knowledgeHubContent.stories },
        { name: 'knowledgeHubCtas', data: knowledgeHubContent.ctas },
    ];

    collectionsToSeed.forEach(coll => {
      coll.data.forEach(item => {
        const docRef = db.collection(coll.name).doc();
        batch.set(docRef, { ...item, id: docRef.id, createdAt: new Date().toISOString() });
      });
    });

    await batch.commit();
    console.log('Initial data seeded successfully.');
  } catch (error) {
    console.error('Error seeding data: ', error);
  } finally {
    isSeeding = false;
  }
}

/**
 * Returns the singleton instance of the Firebase Admin services.
 * This function ensures that Firebase Admin is initialized only once.
 * @returns An object containing the initialized Firestore instance.
 */
export function getFirebaseAdmin() {
  if (adminApp && firestoreInstance) {
    return { firestore: firestoreInstance };
  }

  const appName = 'firebase-admin-app-e9d6a3c2'; 
  const existingApp = getApps().find(app => app.name === appName);
  
  if (existingApp) {
    adminApp = existingApp;
  } else {
     if (!serviceAccount) {
      console.error("CRITICAL ERROR: Service account credentials are not available.");
      console.error("Ensure `secrets/serviceAccountKey.json` exists or SERVICE_ACCOUNT environment variable is set.");
      throw new Error("Could not initialize Firebase Admin SDK. The application cannot start.");
    }

    try {
      adminApp = initializeApp({
        credential: cert(serviceAccount as any),
        projectId: firebaseConfig.projectId,
      }, appName);
      console.log("Firebase Admin SDK initialized successfully using service account key.");
    } catch (e) {
      console.error("CRITICAL ERROR: Failed to initialize Firebase Admin SDK.", e);
      throw new Error("Could not initialize Firebase Admin SDK. The application cannot start.");
    }
  }

  firestoreInstance = getFirestore(adminApp);
  seedDatabase(firestoreInstance).catch(console.error);
  return { firestore: firestoreInstance };
}
