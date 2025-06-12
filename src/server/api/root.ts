import { createTRPCRouter } from "@/server/api/trpc";
import { documentsRouter } from "@/server/api/routers/documents";
import { taxFormsRouter } from "@/server/api/routers/taxForms";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  documents: documentsRouter,
  taxForms: taxFormsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
