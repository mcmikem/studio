
import type { Project } from './types';

export const projects: Project[] = [
  {
    id: 'proj-001',
    name: 'RED Campaign School Tour',
    manager: 'Nansikombi Dianah',
    districts: 'Mpigi, Butambala',
    status: 'Active',
    completion: 65,
    nextMilestone: 'Sign MoU with Nindye SS',
  },
  {
    id: 'proj-002',
    name: 'Dignity Pads Social Enterprise',
    manager: 'Kasirye Constantine',
    districts: 'Mpigi',
    status: 'Moderate',
    completion: 40,
    nextMilestone: 'Finalize v2 prototype based on parent feedback',
  },
  {
    id: 'proj-003',
    name: 'Youth-Led Tree Planting',
    manager: 'Bwire Bashir',
    districts: 'Gomba',
    status: 'Active',
    completion: 80,
    nextMilestone: 'Survival rate audit of first 1,000 trees',
  },
  {
    id: 'proj-004',
    name: 'Campus Ambassador Program',
    manager: 'McMike Mutumba',
    districts: 'Kampala',
    status: 'At Risk',
    completion: 25,
    nextMilestone: 'Recruit ambassadors from 2 new universities',
  },
   {
    id: 'proj-005',
    name: 'Community Soap Making',
    manager: 'Kasirye Constantine',
    districts: 'Mpigi',
    status: 'Delayed',
    completion: 10,
    nextMilestone: 'Secure supplier for raw materials',
  },
];
