

import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App | null = null;
let firestoreInstance: Firestore | null = null;

const knowledgeHubContent = {
  sections: [
    { order: 1, title: 'Mission & Vision', content: '<p><strong>Mission:</strong> To empower young people to learn, lead, and create sustainable change in their communities.</p><p><strong>Vision:</strong> A world where every young person has the skills, confidence, and opportunity to thrive and transform their community.</p><p>Omuto Foundation is a youth-led nonprofit based in Mpigi District, Uganda. We work with schools and communities to build youth leadership, entrepreneurship, education access, sports development, environmental conservation, and creative expression. Our approach is simple: young people are not just beneficiaries — they are leaders and solution-builders.</p>' },
    { order: 2, title: 'Quick Facts', content: '<ul><li><strong>District:</strong> Mpigi</li><li><strong>Country:</strong> Uganda</li><li><strong>Type:</strong> Youth-led organization</li><li><strong>Primary beneficiaries:</strong> children, adolescents, and young people</li><li><strong>Key focus:</strong> schools, youth groups, sports teams, communities</li><li><strong>Recent wins:</strong> planted over 1,300 trees, launched donor nursery beds, established youth entrepreneurship circles, trained student leaders, produced reusable dignity pads.</li></ul>' },
    { 
      order: 3, 
      title: 'Programs & Projects', 
      content: 'An overview of our key initiatives.',
      subsections: [
        { title: 'Omuto Youth Project', content: '<p>Equips young people with leadership, life skills, social action experience, and entrepreneurship capacity.</p><strong>Key components:</strong> Student Leaders Forum (SLF), RED Campaign, GreenSchools Campaign, PureWater Initiative, YoSkills Entrepreneurship Circles, Youth Action Pathway.' },
        { title: 'Student Leaders Forum (SLF)', content: '<p>Training platform for student leaders to drive school and community change. Includes RED Campaign, GreenSchools, and PureWater Initiative.</p>' },
        { title: 'RED Campaign', content: '<p>Supports menstrual health education, dignity, and confidence for girls.</p><strong>Impact Message:</strong> No girl should miss school because of her period.' },
        { title: 'GreenSchools Campaign', content: '<p>Greening schools to build greener communities and futures. Activities include tree planting, environmental clubs, and climate action training.</p><strong>Success Metric:</strong> 1,300+ trees planted and monitored.' },
        { title: 'Omuto Talents Project', content: '<p>Uses football and media to build discipline, leadership, and opportunity.</p><strong>Components:</strong> Omuto Football Alliance (OFA), Omuto Cup, Omuto Pulse.' },
        { title: 'Omuto Essentials (Social Enterprise)', content: '<p>Produces locally made youth-friendly products to support programs and create jobs (e.g., reusable dignity pads, soaps).</p>' },
      ]
    },
     {
      order: 5,
      title: 'Grant Boilerplates',
      content: 'Standard paragraphs for grant proposals.',
      subsections: [
        { title: 'Short Grant Paragraph', content: 'Omuto Foundation is a youth-led nonprofit in Mpigi District, Uganda, working to empower young people through education, leadership development, entrepreneurship, sports, environmental conservation, and menstrual health support. We partner with schools and communities to create long-term, youth-driven change.'},
        { title: 'Problem Statement Example', content: 'Many young people in Mpigi face limited access to quality education, essential health information, economic opportunity, and safe learning environments. Youth have ideas and energy, but lack platforms, mentorship, and resources.'},
        { title: 'Outcome Statement', content: 'Young people gain confidence, leadership skills, entrepreneurship capacity, environmental awareness, and practical experience implementing real projects in their communities.'}
      ]
    }
  ],
  pitches: [
    { order: 1, title: '15-second pitch (youth audience)', content: 'Omuto Foundation helps young people learn skills, lead projects, and change their communities — from tree planting and menstrual health to football and entrepreneurship.' },
    { order: 2, title: '30-second pitch (schools & partners)', content: 'We are a youth-led nonprofit in Mpigi that trains student leaders, runs environmental and menstrual health campaigns, supports youth entrepreneurship, and uses sports and creative arts to engage young people. We work directly with schools and communities to build confidence, skills, and opportunity.'},
    { order: 3, title: '60-second pitch (donors & funders)', content: 'Omuto Foundation empowers young people in Mpigi District with leadership development, entrepreneurship skills, sports programs, environmental action, and menstrual health support. Our programs include the Student Leaders Forum, GreenSchools Campaign, PureWater Initiative, YoSkills entrepreneurship circles, and Omuto Football Alliance. We combine training with real community action so youth are not passive beneficiaries but active solution-makers.'},
  ],
  faqs: [
    { order: 1, question: 'Who runs Omuto Foundation?', answer: 'A youth-led team based in Mpigi working with schools and communities.' },
    { order: 2, question: 'How can I volunteer?', answer: 'Register through Omuto Center app or contact the team.' },
    { order: 3, question: 'Do you only work in Mpigi?', answer: 'Our roots are in Mpigi but we collaborate widely where partnerships exist.' },
    { order: 4, question: 'Do you work with schools?', answer: 'Yes — schools are at the heart of our programs.' },
  ],
  stories: [
    { order: 1, title: "Aisha's Story", content: 'Aisha used to think trees were just shade. After joining GreenSchools, she helped plant fruit trees at her school and now leads a group that waters and monitors them. She says, “I feel like I’m growing with the trees.”' },
    { order: 2, title: "Grace's Story", content: 'Grace missed class because of her periods. After joining RED Campaign sessions and receiving reusable pads, she now attends fully and helps other girls learn hygiene with confidence.' },
    { order: 3, title: "Musa's Story", content: 'Musa joined Omuto Football Alliance to play. He stayed because he found mentorship, discipline, and teamwork. His new dream is to coach younger players.' },
  ]
};


async function seedKnowledgeHub(db: Firestore) {
  console.log('Checking if Knowledge Hub data needs seeding...');
  const sectionsSnapshot = await db.collection('knowledgeHubSections').limit(1).get();
  
  if (!sectionsSnapshot.empty) {
    console.log('Knowledge Hub data already exists. Skipping seed.');
    return;
  }

  console.log('Seeding Knowledge Hub data...');
  const batch = db.batch();

  knowledgeHubContent.sections.forEach(section => {
    const docRef = db.collection('knowledgeHubSections').doc();
    batch.set(docRef, section);
  });

  knowledgeHubContent.pitches.forEach(pitch => {
    const docRef = db.collection('knowledgeHubPitches').doc();
    batch.set(docRef, pitch);
  });
  
  knowledgeHubContent.faqs.forEach(faq => {
    const docRef = db.collection('knowledgeHubFaqs').doc();
    batch.set(docRef, faq);
  });
  
  knowledgeHubContent.stories.forEach(story => {
    const docRef = db.collection('knowledgeHubStories').doc();
    batch.set(docRef, story);
  });

  try {
    await batch.commit();
    console.log('Knowledge Hub data seeded successfully.');
  } catch (error) {
    console.error('Error seeding Knowledge Hub data: ', error);
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

  const appName = 'firebase-admin-app-e9d6a3c2'; // Use a unique name to avoid conflicts
  const existingApp = getApps().find(app => app.name === appName);
  
  if (existingApp) {
    adminApp = existingApp;
  } else {
    try {
      const serviceAccountPath = path.resolve(process.cwd(), 'secrets/serviceAccountKey.json');
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error("Firebase service account key not found at secrets/serviceAccountKey.json. Ensure the file exists and is correctly placed.");
      }
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      }, appName);
  
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (e) {
      console.error("Critical Error: Failed to initialize Firebase Admin SDK.", e);
      // In a server environment, this is a fatal error.
      // We throw to prevent the application from running in a broken state.
      throw new Error("Could not initialize Firebase Admin SDK. The application cannot start.");
    }
  }

  firestoreInstance = getFirestore(adminApp);
  seedKnowledgeHub(firestoreInstance).catch(console.error); // Seed the knowledge hub data
  return { firestore: firestoreInstance };
}
