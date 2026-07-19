import { z } from "zod";
import { LeadStatus, LeadSource } from "@prisma/client";

const statusValues = Object.values(LeadStatus) as [LeadStatus, ...LeadStatus[]];
const sourceValues = Object.values(LeadSource) as [LeadSource, ...LeadSource[]];

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  company: z.string().max(200).optional().or(z.literal("")),
  industry: z.string().max(100).optional().or(z.literal("")),
  source: z.enum(sourceValues).default("OTHER"),
  ownerId: z.string().uuid().optional().or(z.literal("")),
  campaignId: z.string().optional().or(z.literal("")),
  potentialRevenue: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.coerce.number().min(0).optional(),
  ),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export const updateLeadSchema = createLeadSchema.extend({
  id: z.string().min(1),
});

export const updateLeadStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(statusValues),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
