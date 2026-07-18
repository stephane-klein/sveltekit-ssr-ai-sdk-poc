import { tool } from 'ai';
import { z } from 'zod';
import { sqlReadonly } from './db-ai-readonly.js';
import { logger } from '../../logger.js';

export const readOnlySqlQuery = tool({
  description:
    'Execute a read-only SQL query against the PostgreSQL database. ' +
    'Available table:\n' +
    '- contacts(id BIGINT, firstname TEXT, lastname TEXT, created_at TIMESTAMPTZ)\n' +
    'Only SELECT, EXPLAIN, and WITH (read-only CTE) queries are allowed.',
  inputSchema: z.object({
    query: z.string().describe('The read-only SQL query to execute'),
  }),
  execute: async ({ query }) => {
    logger.debug({ query }, 'Executing SQL query via tool');

    const rows = await sqlReadonly.unsafe(query);

    logger.debug({ rowCount: rows.length }, 'SQL query executed via tool');

    return JSON.stringify(rows, null, 2);
  },
});
