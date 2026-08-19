import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    id: v.string(),
    name: v.string(),
    email: v.string(),
    avatarColor: v.string(),
    defaultCurrency: v.string(),
    createdAt: v.string(),
  }).index("by_email", ["email"]),

  trips: defineTable({
    name: v.string(),
    destination: v.string(),
    baseCurrency: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    createdBy: v.string(),
    joinCode: v.string(), // 6-character code e.g. "SAKURA"
    totalBudget: v.optional(v.number()),
    archived: v.boolean(),
    members: v.array(
      v.object({
        userId: v.string(),
        name: v.string(),
        role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
        avatarColor: v.string(),
        defaultWeight: v.number(),
        email: v.optional(v.string()),
      })
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_join_code", ["joinCode"]),

  expenses: defineTable({
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
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_trip", ["tripId"]),

  settlements: defineTable({
    tripId: v.string(),
    fromUserId: v.string(),
    toUserId: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(),
    paymentMethod: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_trip", ["tripId"]),

  auditLogs: defineTable({
    tripId: v.string(),
    userId: v.string(),
    userName: v.string(),
    action: v.string(),
    details: v.string(),
    timestamp: v.string(),
  }).index("by_trip", ["tripId"]),
});
