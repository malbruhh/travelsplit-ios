import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getExpensesByTrip = query({
  args: { tripId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .order("desc")
      .collect();
  },
});

export const createExpense = mutation({
  args: {
    tripId: v.string(),
    title: v.string(),
    category: v.string(),
    amount: v.number(),
    currency: v.string(),
    exchangeRate: v.number(),
    date: v.string(),
    paidBy: v.array(
      v.object({
        userId: v.string(),
        amount: v.number(),
      })
    ),
    splitType: v.string(),
    splitWithMemberIds: v.array(v.string()),
    customSplits: v.optional(v.any()),
    itemizedItems: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          amount: v.number(),
          assignedMemberIds: v.array(v.string()),
        })
      )
    ),
    taxAmount: v.optional(v.number()),
    tipAmount: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("expenses", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
