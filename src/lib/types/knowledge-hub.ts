import { z } from 'zod';

export const KnowledgeHubCTASchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    buttonLabel: z.string(),
});

export type KnowledgeHubCTA = z.infer<typeof KnowledgeHubCTASchema>;

export type KnowledgeHubSection = {
    id: string;
    title: string;
    summary: string;
    subsections: {
        title: string;
        summary: string;
    }[];
}

export type KnowledgeHubPitch = {
    id: string;
    title: string;
    summary: string;
}
