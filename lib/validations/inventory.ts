import { z } from "zod";

const decimalInput = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => value !== "", "Quantity is required")
  .refine((value) => !Number.isNaN(Number(value)), "Use a valid number")
  .refine((value) => Number(value) >= 0, "Quantity cannot be negative")
  .transform((value) => Number(value).toFixed(2));

export const inventoryItemUpdateSchema = z.object({
  menuItemId: z.string().uuid(),
  unit: z.string().trim().min(1, "Unit is required").max(40, "Unit is too long"),
  currentQuantity: decimalInput,
  lowStockThreshold: decimalInput,
  isTracked: z.boolean(),
  notes: z.string().trim().max(240, "Notes are too long").optional().or(z.literal("")),
});
