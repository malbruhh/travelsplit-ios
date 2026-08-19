import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getTrips = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("trips").order("desc").collect();
  },
});

export const getTripByJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, args) => {
    const code = args.joinCode.toUpperCase();
    return await ctx.db
      .query("trips")
      .withIndex("by_join_code", (q) => q.eq("joinCode", code))
      .first();
  },
});

export const createTrip = mutation({
  args: {
    name: v.string(),
    destination: v.string(),
    baseCurrency: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    createdBy: v.string(),
    joinCode: v.string(),
    totalBudget: v.optional(v.number()),
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
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("trips", {
      ...args,
      joinCode: args.joinCode.toUpperCase(),
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const joinTrip = mutation({
  args: {
    joinCode: v.string(),
    user: v.object({
      id: v.string(),
      name: v.string(),
      email: v.string(),
      avatarColor: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const code = args.joinCode.toUpperCase();
    const trip = await ctx.db
      .query("trips")
      .withIndex("by_join_code", (q) => q.eq("joinCode", code))
      .first();

    if (!trip) throw new Error("Invalid trip join code");

    const existingIdx = trip.members.findIndex((m) => m.userId === args.user.id || m.email === args.user.email);
    if (existingIdx === -1) {
      const updatedMembers = [
        ...trip.members,
        {
          userId: args.user.id,
          name: args.user.name,
          role: "editor" as const,
          avatarColor: args.user.avatarColor || "#007AFF",
          defaultWeight: 1,
          email: args.user.email,
        },
      ];

      const now = new Date().toISOString();
      await ctx.db.patch(trip._id, {
        members: updatedMembers,
        updatedAt: now,
      });

      await ctx.db.insert("auditLogs", {
        tripId: trip._id,
        userId: args.user.id,
        userName: args.user.name,
        action: "ADD_MEMBER",
        details: `${args.user.name} joined via code ${code}`,
        timestamp: now,
      });
    }

    return await ctx.db.get(trip._id);
  },
});
