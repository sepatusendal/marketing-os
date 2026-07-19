import { prisma } from "@/lib/prisma";
import type { Prisma, LeadStatus, LeadSource } from "@prisma/client";
import type { CreateLeadInput, UpdateLeadInput } from "@/lib/schemas/lead";

const LEAD_INCLUDE = {
  owner: true,
  campaign: { select: { id: true, name: true } },
  client: true,
} satisfies Prisma.LeadInclude;

export type LeadListFilters = {
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
};

function leadWhere(filters: LeadListFilters): Prisma.LeadWhereInput {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.search
      ? { name: { contains: filters.search, mode: "insensitive" } }
      : {}),
  };
}

/** Unbounded — used by the pipeline board, which needs every lead in every column. */
export async function listLeads(filters: LeadListFilters = {}) {
  return prisma.lead.findMany({
    where: leadWhere(filters),
    include: LEAD_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

const LEAD_PAGE_SIZE = 25;

/** Cursor-paginated — used by the table view. */
export async function listLeadsPaginated(filters: LeadListFilters & { cursor?: string } = {}) {
  const rows = await prisma.lead.findMany({
    where: leadWhere(filters),
    include: LEAD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: LEAD_PAGE_SIZE + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > LEAD_PAGE_SIZE;
  const leads = hasMore ? rows.slice(0, LEAD_PAGE_SIZE) : rows;

  return { leads, nextCursor: hasMore ? leads[leads.length - 1].id : null };
}

export async function getLead(id: string) {
  return prisma.lead.findUnique({ where: { id }, include: LEAD_INCLUDE });
}

export async function findDuplicateLead(name: string, company: string | undefined, excludeId?: string) {
  if (!company) return null;
  return prisma.lead.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      company: { equals: company, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function createLead(input: CreateLeadInput) {
  return prisma.lead.create({
    data: {
      name: input.name,
      company: input.company || null,
      industry: input.industry || null,
      source: input.source,
      ownerId: input.ownerId || null,
      campaignId: input.campaignId || null,
      potentialRevenue: input.potentialRevenue ?? null,
      notes: input.notes || null,
    },
    include: LEAD_INCLUDE,
  });
}

export async function updateLead(input: UpdateLeadInput) {
  return prisma.lead.update({
    where: { id: input.id },
    data: {
      name: input.name,
      company: input.company || null,
      industry: input.industry || null,
      source: input.source,
      ownerId: input.ownerId || null,
      campaignId: input.campaignId || null,
      potentialRevenue: input.potentialRevenue ?? null,
      notes: input.notes || null,
    },
    include: LEAD_INCLUDE,
  });
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  return prisma.lead.update({ where: { id }, data: { status }, include: LEAD_INCLUDE });
}

export async function touchLastContact(id: string) {
  return prisma.lead.update({ where: { id }, data: { lastContactAt: new Date() } });
}

export async function convertToClient(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { client: true } });
  if (!lead) throw new Error("Lead not found");
  if (lead.status !== "WON") throw new Error("Only Won leads can be converted");
  if (lead.client) return lead.client;

  return prisma.client.create({
    data: {
      leadId: lead.id,
      name: lead.name,
      company: lead.company,
    },
  });
}

export async function listClients() {
  return prisma.client.findMany({
    include: { lead: { include: { owner: true, campaign: { select: { id: true, name: true } } } } },
    orderBy: { since: "desc" },
  });
}
