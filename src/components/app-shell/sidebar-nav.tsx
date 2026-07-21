"use client";

import type { Role } from "@prisma/client";
import { NavItems } from "./nav-items";

export function SidebarNav({ role }: { role: Role }) {
  return <NavItems role={role} />;
}
