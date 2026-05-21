import { z } from "zod";

import { drinkCategories } from "@/data/drinks";

export const createOrderSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(80, "Name is too long"),
    categoryId: z.string().min(1, "Category is required"),
    drinkId: z.string().min(1, "Drink is required"),
  })
  .superRefine((data, ctx) => {
    const category = drinkCategories.find((item) => item.id === data.categoryId);

    if (!category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "Invalid category selected",
      });
      return;
    }

    const drink = category.drinks.find(
      (item) => item.id === data.drinkId && item.isActive,
    );

    if (!drink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["drinkId"],
        message: "Invalid drink selected",
      });
    }
  });

export const customerCancelOrderSchema = z.object({
  customerToken: z.string().min(20),
  cancelReason: z.string().trim().max(200).optional(),
});

export const staffCancelOrderSchema = z.object({
  cancelReason: z.string().trim().max(200).optional(),
});

export const orderStatusRequestSchema = z.object({
  orders: z.array(
    z.object({
      orderId: z.string().uuid(),
      customerToken: z.string().min(20),
    }),
  ),
});

export const mixologistAccessSchema = z.object({
  accessKey: z.string().min(4, "Access key is required"),
});
