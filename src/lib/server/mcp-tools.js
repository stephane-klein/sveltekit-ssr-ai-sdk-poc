import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readOnlySqlQuery } from './sql-query-tool.js';
import { listSkills, loadSkill as loadSkillContent } from './skills/index.js';
import { logger } from '../../logger.js';

export function createMcpServer() {
  const server = new Server(
    { name: 'sveltekit-ssr-ai-sdk-poc', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'readOnlySqlQuery',
        description:
          'Execute a read-only SQL query against the PostgreSQL database.\n' +
          'Available table:\n' +
          '- contacts(id BIGINT, firstname TEXT, lastname TEXT, created_at TIMESTAMPTZ)\n' +
          'Only SELECT, EXPLAIN, and WITH (read-only CTE) queries are allowed.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The read-only SQL query to execute',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'listSkills',
        description: 'List all available skills by name and description',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'loadSkill',
        description:
          'Load a skill by name to get specialized instructions. Call this when a user request matches a skill description.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The skill name to load',
            },
          },
          required: ['name'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.debug({ toolName: name, args }, 'MCP tool call');

    switch (name) {
      case 'readOnlySqlQuery': {
        const result = await readOnlySqlQuery.execute({ query: args.query });
        return { content: [{ type: 'text', text: result }] };
      }

      case 'listSkills': {
        const skills = listSkills();
        return {
          content: [{ type: 'text', text: JSON.stringify(skills, null, 2) }],
        };
      }

      case 'loadSkill': {
        const content = loadSkillContent(args.name);
        if (!content) {
          return {
            content: [
              {
                type: 'text',
                text: `Skill "${args.name}" not found. Available skills: ${listSkills().map((s) => s.name).join(', ')}`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: `--- Skill "${args.name}" loaded ---\n${content}`,
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  });

  return server;
}
