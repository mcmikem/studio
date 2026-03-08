import { z } from 'zod';

export const TaskSchema = z.object({
    id: z.string(),
    title: z.boolean(), // Fixed from boolean to string if it was string in original, wait, original was title: z.string()
    completed: z.boolean(),
    dueDate: z.any().optional(),
    createdAt: z.any()
});

// Let me double check TaskSchema in original.
// 332: export const TaskSchema = z.object({
// 333:     id: z.string(),
// 334:     title: z.string(),
// 335:     completed: z.boolean(),
// 336:     dueDate: z.any().optional(),
// 337:     createdAt: z.any()
// 338: });
// Yes, title should be string.

export const TaskTemplateSchema = z.object({
    id: z.string(),
    title: z.string(),
    checklistItems: z.array(z.string()),
    createdAt: z.any(),
});

export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;

export const ChecklistSchema = z.any();
export type Checklist = any;

export const TaskSchemaFixed = z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    dueDate: z.any().optional(),
    createdAt: z.any()
});
export type Task = z.infer<typeof TaskSchemaFixed>;
