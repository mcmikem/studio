
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
    return findGrantOpportunitiesToolObject;
}

export async function findUsersByNameTool() {
    return findUsersByNameToolObject;
}

export async function findProgramsByNameTool() {
    return findProgramsByNameToolObject;
}

export async function findExpensesByTitleTool() {
    return findExpensesByTitleToolObject;
}

export async function searchOmutoTool() {
    return searchOmutoToolObject;
}

export async function createCheckoutTool() {
    return createCheckoutToolObject;
}

export async function getActivitiesForProgramTool() {
    return getActivitiesForProgramToolObject;
}

export async function getRecentCheckoutsTool() {
    return getRecentCheckoutsToolObject;
}

export async function getRecentCheckinsTool() {
    return getRecentCheckinsToolObject;
}

export async function getUpcomingEventsForUserTool() {
    return getUpcomingEventsForUserToolObject;
}

export async function getPendingTasksForUserTool() {
    return getPendingTasksForUserToolObject;
}
