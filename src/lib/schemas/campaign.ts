import { z } from "zod";
import { CampaignStatus, Priority } from "@prisma/client";

const campaignStatusValues = Object.values(CampaignStatus) as [
  CampaignStatus,
  ...CampaignStatus[],
];
const priorityValues = Object.values(Priority) as [Priority, ...Priority[]];

export const kpiTargetSchema = z.object({
  name: z.string().min(1),
  target: z.number(),
  unit: z.string().optional(),
});

export const kpiActualSchema = z.object({
  name: z.string().min(1),
  actual: z.number(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  objective: z.string().max(2000).optional().or(z.literal("")),
  department: z.string().max(100).optional().or(z.literal("")),
  ownerId: z.string().uuid(),
  priority: z.enum(priorityValues).default("MEDIUM"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  budgetAllocated: z.coerce.number().min(0).default(0),
  description: z.string().max(5000).optional().or(z.literal("")),
  targetKpi: z.array(kpiTargetSchema).optional(),
});

export const updateCampaignSchema = createCampaignSchema.extend({
  id: z.string().min(1),
  actualKpi: z.array(kpiActualSchema).optional(),
});

export const updateCampaignStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(campaignStatusValues),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type UpdateCampaignStatusInput = z.infer<
  typeof updateCampaignStatusSchema
>;
