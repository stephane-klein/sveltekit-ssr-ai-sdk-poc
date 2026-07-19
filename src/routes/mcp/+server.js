import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from '$lib/server/mcp-tools.js';
import { logger } from '../../logger.js';

const sessions = new Map();

async function createSession() {
  let sid;
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => {
      sid = crypto.randomUUID();
      return sid;
    },
    onsessioninitialized: (id) => {
      sessions.set(id, { server, transport });
      logger.info({ sessionId: id }, 'MCP session initialized');
    },
  });
  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
      logger.info({ sessionId: transport.sessionId }, 'MCP session closed');
    }
  };

  await server.connect(transport);

  return { server, transport };
}

async function handleMcp({ request }) {
  const sessionId = request.headers.get('mcp-session-id');

  if (sessionId) {
    const entry = sessions.get(sessionId);
    if (!entry) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Session not found' },
          id: null,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return entry.transport.handleRequest(request);
  }

  const { transport } = await createSession();
  return transport.handleRequest(request);
}

export async function POST({ request }) {
  return handleMcp({ request });
}

export async function GET({ request }) {
  return handleMcp({ request });
}

export async function DELETE({ request }) {
  return handleMcp({ request });
}
