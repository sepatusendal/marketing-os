import { prisma } from "@/lib/prisma";
import type { Prisma, ClientStatus } from "@prisma/client";
import type { CreateClientInput, UpdateClientInput } from "@/lib/schemas/client";

const CLIENT_INCLUDE = {
  owner: true,
  lead: { include: { owner: true, campaign: { select: { id: true, name: true } } } },
} satisfies Prisma.ClientInclude;

export type ClientListFilters = {
  status?: ClientStatus;
  search?: string;
};

function clientWhere(filters: ClientListFilters): Prisma.ClientWhereInput {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { company: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function listClients(filters: ClientListFilters = {}) {
  return prisma.client.findMany({
    where: clientWhere(filters),
    include: CLIENT_INCLUDE,
    orderBy: { since: "desc" },
  });
}

export async function getClient(id: string) {
  return prisma.client.findUnique({ where: { id }, include: CLIENT_INCLUDE });
}

export async function findDuplicateClient(name: string, company: string | undefined) {
  if (!company) return null;
  return prisma.client.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      company: { equals: company, mode: "insensitive" },
    },
  });
}

/** Won leads convert here — carries over industry/phone/owner so the client record isn't a blank slate. */
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
      phone: lead.phone,
      industry: lead.industry,
      ownerId: lead.ownerId,
      contractValue: lead.potentialRevenue,
    },
    include: CLIENT_INCLUDE,
  });
}

/** Direct create for clients that predate this app — the "sync my existing roster" path. */
export async function createClient(input: CreateClientInput) {
  return prisma.client.create({
    data: {
      name: input.name,
      company: input.company || null,
      email: input.email || null,
      phone: input.phone || null,
      industry: input.industry || null,
      status: input.status,
      contractValue: input.contractValue ?? null,
      ownerId: input.ownerId || null,
      since: input.since ? new Date(input.since) : undefined,
      notes: input.notes || null,
    },
    include: CLIENT_INCLUDE,
  });
}

export async function updateClient(input: UpdateClientInput) {
  return prisma.client.update({
    where: { id: input.id },
    data: {
      name: input.name,
      company: input.company || null,
      email: input.email || null,
      phone: input.phone || null,
      industry: input.industry || null,
      status: input.status,
      contractValue: input.contractValue ?? null,
      ownerId: input.ownerId || null,
      since: input.since ? new Date(input.since) : undefined,
      notes: input.notes || null,
    },
    include: CLIENT_INCLUDE,
  });
}

export async function getClientStats() {
  const [total, byStatus, contractValueSum] = await Promise.all([
    prisma.client.count(),
    prisma.client.groupBy({ by: ["status"], _count: true }),
    prisma.client.aggregate({ _sum: { contractValue: true }, where: { status: "ACTIVE" } }),
  ]);

  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r._count])) as Record<
    ClientStatus,
    number
  >;

  return {
    total,
    active: counts.ACTIVE ?? 0,
    inactive: counts.INACTIVE ?? 0,
    churned: counts.CHURNED ?? 0,
    activeContractValue: contractValueSum._sum.contractValue?.toString() ?? "0",
  };
}
