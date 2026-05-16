import { mutation, query } from "./_generated/server";

// biome-ignore lint/suspicious/noExplicitAny: wrapper uses `typeof mutation` externally for full type inference
export const adminMutation: typeof mutation = ((config: any) => {
  const originalHandler = config.handler;
  return mutation({
    ...config,
    // biome-ignore lint/suspicious/noExplicitAny: passthrough to underlying mutation
    handler: async (ctx: any, args: any) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized");
      }
      return originalHandler(ctx, args);
    },
  });
}) as typeof mutation;

// biome-ignore lint/suspicious/noExplicitAny: wrapper uses `typeof query` externally for full type inference
export const adminQuery: typeof query = ((config: any) => {
  const originalHandler = config.handler;
  return query({
    ...config,
    // biome-ignore lint/suspicious/noExplicitAny: passthrough to underlying query
    handler: async (ctx: any, args: any) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized");
      }
      return originalHandler(ctx, args);
    },
  });
}) as typeof query;
