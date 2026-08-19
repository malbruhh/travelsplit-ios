import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSettlementsByTrip = query({
  args: { tripId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settlements")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .order("desc")
      .collect();
  },
});

export const createSettlement = mutation({
  args: {
    tripId: v.string(),
    fromUserId: v.string(),
    toUserId: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(),
    paymentMethod: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("settlements", {
      ...args,
      createdAt: now,
    });
  },
});

export const deleteSettlement = mutation({
  args: { id: v.id("settlements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
