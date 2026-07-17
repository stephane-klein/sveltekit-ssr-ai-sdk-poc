import { error } from '@sveltejs/kit';
import { streamText, toUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { model } from '$lib/ai.js';
import { sql } from '../../../db.js';
import { logger } from '../../../logger.js';

function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export const POST = async ({ request, params }) => {
  const reqStart = performance.now();
  const { slug } = params;
  const { messages, reasoningLevel } = await request.json();

  const [conversation] = await sql`
    SELECT id FROM conversations WHERE slug = ${slug}
  `;

  if (!conversation) {
    throw error(404, 'Conversation not found');
  }

  const conversationId = conversation.id;

  logger.info({ conversationId, messagesCount: messages?.length, roles: messages?.map(m => m.role) }, `POST /chats/${slug} - incoming messages`);

  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1);
  if (lastUserMsg) {
    const text = lastUserMsg.content || lastUserMsg.parts?.filter(p => p.type === 'text').map(p => p.text).join('') || '';
    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${conversationId}, 'user', ${text})
    `;
    logger.debug({ conversationId, content: text }, 'Persisted user message');
  }

  const dbMessages = await sql`
    SELECT role, content FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;

  const modelMessages = dbMessages.map(m => ({ role: m.role, content: m.content }));
  const prepEnd = performance.now();
  const dbPrepMs = prepEnd - reqStart;

  logger.info({
    conversationId,
    modelMessagesCount: modelMessages.length,
    roles: modelMessages.map(m => m.role),
    time_to_db_prep_ms: Math.round(dbPrepMs),
    time_to_db_prep: formatDuration(dbPrepMs),
  }, 'Converted messages for LLM');

  let firstChunkTime = null;
  const streamStart = performance.now();

  const result = streamText({
    model,
    messages: modelMessages,
    system: 'You are a helpful assistant. Answer directly and concisely.',
    reasoning: reasoningLevel !== 'none' ? reasoningLevel : undefined,
    onChunk: async ({ chunk }) => {
      if (chunk.type === 'text-delta' && firstChunkTime === null) {
        firstChunkTime = performance.now();
        const firstTokenMs = firstChunkTime - reqStart;
        logger.info({
          conversationId,
          time_to_first_token_ms: Math.round(firstTokenMs),
          time_to_first_token: formatDuration(firstTokenMs),
          time_to_db_prep_ms: Math.round(streamStart - reqStart),
          time_to_db_prep: formatDuration(streamStart - reqStart),
        }, 'First token received');
      }
    },
    onFinish: async (event) => {
      const now = performance.now();
      const text = event.text || '';
      const endMs = now - reqStart;
      const streamMs = now - streamStart;
      const firstTokenMs = firstChunkTime ? firstChunkTime - reqStart : null;
      logger.info({
        conversationId,
        finishReason: event.finishReason,
        textLength: text.length,
        time_to_first_token_ms: firstTokenMs ? Math.round(firstTokenMs) : null,
        time_to_first_token: firstTokenMs ? formatDuration(firstTokenMs) : null,
        stream_duration_ms: Math.round(streamMs),
        stream_duration: formatDuration(streamMs),
        total_time_ms: Math.round(endMs),
        total_time: formatDuration(endMs),
      }, 'LLM stream finished');
      logger.debug({ content: text }, 'Persisting assistant response');
      await sql`
        INSERT INTO messages (conversation_id, role, content)
        VALUES (${conversationId}, 'assistant', ${text})
      `;
      logger.info({ conversationId }, 'Assistant response persisted');

      await sql`
        UPDATE conversations SET updated_at = NOW() WHERE id = ${conversationId}
      `;
    },
    onError: async (error) => {
      logger.error({ err: error.message, conversationId }, 'LLM stream error');
    },
  });

  const httpMs = performance.now() - reqStart;
  logger.info({
    conversationId,
    http_response_ms: Math.round(httpMs),
    http_response_time: formatDuration(httpMs),
  }, 'Returning stream response to client');

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
};
