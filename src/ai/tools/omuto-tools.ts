
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
