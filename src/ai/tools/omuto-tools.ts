
'use server';
/**
 * @fileOverview This file acts as a server-side entry point for AI tools.
 * It uses the 'use server' directive and exports async functions that
 * return the actual tool objects defined elsewhere. This ensures that
 * only async functions are exported from the server module, complying
 * with Next.js Server Action constraints.
 */

import { 
    findGrantOpportunitiesToolObject,
    findUsersByNameToolObject,
    findProgramsByNameToolObject,
    findExpensesByTitleToolObject,
    searchOmutoToolObject,
    createCheckoutToolObject,
    getActivitiesForProgramToolObject,
    getRecentCheckoutsToolObject,
    getRecentCheckinsToolObject,
    getUpcomingEventsForUserToolObject,
    getPendingTasksForUserToolObject,
} from '../definitions';

export const findGrantOpportunitiesTool = findGrantOpportunitiesToolObject;
export const findUsersByNameTool = findUsersByNameToolObject;
export const findProgramsByNameTool = findProgramsByNameToolObject;
export const findExpensesByTitleTool = findExpensesByTitleToolObject;
export const searchOmutoTool = searchOmutoToolObject;
export const createCheckoutTool = createCheckoutToolObject;
export const getActivitiesForProgramTool = getActivitiesForProgramToolObject;
export const getRecentCheckoutsTool = getRecentCheckoutsToolObject;
export const getRecentCheckinsTool = getRecentCheckinsToolObject;
export const getUpcomingEventsForUserTool = getUpcomingEventsForUserToolObject;
export const getPendingTasksForUserTool = getPendingTasksForUserToolObject;
