import { z } from "zod";
import { ClientStatus } from "@prisma/client";

const statusValues = Object.values(ClientStatus) as [ClientStatus, ...ClientStatus[]];

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  company: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  industry: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(statusValues).default("ACTIVE"),
  contractValue: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.coerce.number().min(0).optional(),
  ),
  ownerId: z.string().uuid().optional().or(z.literal("")),
  since: z.string().optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export const updateClientSchema = createClientSchema.extend({
  id: z.string().min(1),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
