import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createTimesheetInputSchema,
  updateTimesheetInputSchema,
  searchTimesheetInputSchema,
  deleteTimesheetInputSchema,
  getTimesheetByIdInputSchema
} from './schema';

// Import handlers
import { createTimesheet } from './handlers/create_timesheet';
import { getTimesheets } from './handlers/get_timesheets';
import { getTimesheetById } from './handlers/get_timesheet_by_id';
import { updateTimesheet } from './handlers/update_timesheet';
import { deleteTimesheet } from './handlers/delete_timesheet';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new timesheet entry
  createTimesheet: publicProcedure
    .input(createTimesheetInputSchema)
    .mutation(({ input }) => createTimesheet(input)),

  // Get all timesheet entries with optional search and filter
  getTimesheets: publicProcedure
    .input(searchTimesheetInputSchema.optional())
    .query(({ input }) => getTimesheets(input)),

  // Get a single timesheet entry by ID
  getTimesheetById: publicProcedure
    .input(getTimesheetByIdInputSchema)
    .query(({ input }) => getTimesheetById(input)),

  // Update an existing timesheet entry
  updateTimesheet: publicProcedure
    .input(updateTimesheetInputSchema)
    .mutation(({ input }) => updateTimesheet(input)),

  // Delete a timesheet entry
  deleteTimesheet: publicProcedure
    .input(deleteTimesheetInputSchema)
    .mutation(({ input }) => deleteTimesheet(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();