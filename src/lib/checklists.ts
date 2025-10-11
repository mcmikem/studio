
import type { Checklist } from './types';

export const operationalChecklists: Checklist[] = [
  {
    id: 'field-visit',
    title: 'Field Visit Checklist',
    category: 'Field Operations',
    sections: [
      {
        title: 'PRE-VISIT (Day Before)',
        items: [
          'Confirm appointment with school/community',
          'Prepare materials and equipment',
          'Check transport arrangements',
          'Brief volunteers on roles',
          'Charge devices and cameras',
        ],
      },
      {
        title: 'DURING VISIT',
        items: [
          'Safety briefing with team',
          'Document with photos (min 5)',
          'Collect attendance data',
          'Engage community participants',
          'Identify potential leaders',
        ],
      },
      {
        title: 'POST-VISIT (Within 24hrs)',
        items: [
          'Log activity in app',
          'Submit expense reports',
          'Upload photos to Pulse',
          'Schedule follow-up actions',
          'Update contact database',
        ],
      },
    ],
  },
];
