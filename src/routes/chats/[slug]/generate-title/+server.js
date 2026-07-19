import { json, error } from '@sveltejs/kit';
import { generateText } from 'ai';
import { model } from '$lib/ai.js';
import { sql } from '$lib/server/db.js';
import { logger } from '../../../../logger.js';

function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export const POST = async ({ params }) => {
  const reqStart = performance.now();
  const { slug } = params;

  const [conversation] = await sql`
    SELECT id FROM conversations WHERE slug = ${slug}
  `;

  if (!conversation) {
    throw error(404, 'Conversation not found');
  }

  const conversationId = conversation.id;
  const dbFindMs = performance.now() - reqStart;

  logger.info({ conversationId, slug, db_find_ms: Math.round(dbFindMs), db_find: formatDuration(dbFindMs) }, 'Generating conversation title');

  const messages = await sql`
    SELECT role, content FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;

  const dbFetchMs = performance.now() - reqStart - dbFindMs;
  const totalDbMs = performance.now() - reqStart;

  const conversationText = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = messages.length === 0
    ? 'Generate a short, generic title for an empty conversation (maximum 5 words). Respond with ONLY the title, no quotes, no extra text.'
    : 'Generate a concise title (maximum 6 words) for the following conversation. Respond with ONLY the title, no quotes, no extra text, no punctuation at the end.\n\n' + conversationText;

  logger.debug({
    conversationId,
    messagesCount: messages.length,
    total_input_text_length: conversationText.length,
    db_fetch_ms: Math.round(dbFetchMs),
    db_fetch: formatDuration(dbFetchMs),
    total_db_time_ms: Math.round(totalDbMs),
    total_db_time: formatDuration(totalDbMs),
  }, 'Calling LLM for title generation');

  const llmStart = performance.now();
  const { text } = await generateText({
    model,
    system: 'You are a helpful assistant that generates short conversation titles.',
    prompt,
  });
  const llmMs = performance.now() - llmStart;

  const cleanTitle = text.trim().replace(/^["']|["']$/g, '');

  const updateStart = performance.now();
  await sql`
    UPDATE conversations SET title = ${cleanTitle}, updated_at = NOW()
    WHERE id = ${conversationId}
  `;
  const dbUpdateMs = performance.now() - updateStart;

  const totalMs = performance.now() - reqStart;

  logger.info({
    conversationId,
    title: cleanTitle,
    llm_duration_ms: Math.round(llmMs),
    llm_duration: formatDuration(llmMs),
    db_update_ms: Math.round(dbUpdateMs),
    db_update: formatDuration(dbUpdateMs),
    total_time_ms: Math.round(totalMs),
    total_time: formatDuration(totalMs),
  }, 'Conversation title generated and saved');

  return json({ title: cleanTitle });
};
