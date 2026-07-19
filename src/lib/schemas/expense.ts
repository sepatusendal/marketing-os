import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";

const categoryValues = Object.values(ExpenseCategory) as [
  ExpenseCategory,
  ...ExpenseCategory[],
];

export const createExpenseSchema = z.object({
  campaignId: z.string().min(1, "Campaign is required"),
  category: z.enum(categoryValues),
  description: z.string().min(1, "Description is required").max(500),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  spentAt: z.string().min(1, "Date is required"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
