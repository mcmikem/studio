
'use server';

/**
 * @fileOverview This file exports async functions that return tool definitions.
 * This pattern is required for 'use server' compatibility in Next.js, as tool
 * objects themselves cannot be directly exported from server-side modules.
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
} from './definitions';

export async function findGrantOpportunitiesTool() {
    return await findGrantOpportunitiesToolObject();
}

export async function findUsersByNameTool() {
    return await findUsersByNameToolObject();
}

export async function findProgramsByNameTool() {
    return await findProgramsByNameToolObject();
}

export async function findExpensesByTitleTool() {
    return await findExpensesByTitleToolObject();
}

export async function searchOmutoTool() {
    return await searchOmutoToolObject();
}

export async function createCheckoutTool() {
    return await createCheckoutToolObject();
}

export async function getActivitiesForProgramTool() {
    return await getActivitiesForProgramToolObject();
}

export async function getRecentCheckoutsTool() {
    return await getRecentCheckoutsToolObject();
}

export async function getRecentCheckinsTool() {
    return await getRecentCheckinsToolObject();
}

export async function getUpcomingEventsForUserTool() {
    return await getUpcomingEventsForUserToolObject();
}

export async function getPendingTasksForUserTool() {
    return await getPendingTasksForUserToolObject();
}
