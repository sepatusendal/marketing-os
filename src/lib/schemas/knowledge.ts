import { z } from "zod";
import { KnowledgeType } from "@prisma/client";

const typeValues = Object.values(KnowledgeType) as [KnowledgeType, ...KnowledgeType[]];

export const createKnowledgeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(typeValues),
  body: z.string().min(1, "Body cannot be empty"),
  campaignId: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")), // comma-separated in the form
});

export const updateKnowledgeSchema = createKnowledgeSchema.extend({
  id: z.string().min(1),
});

export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;
export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeSchema>;
