import { error } from '@sveltejs/kit';
import { sql } from '$lib/server/db.js';

export async function load({ params }) {
  const { slug } = params;

  const [conversation] = await sql`
    SELECT id, slug, title, created_at, updated_at
    FROM conversations
    WHERE slug = ${slug}
  `;

  if (!conversation) {
    throw error(404, 'Conversation not found');
  }

  const messages = await sql`
    SELECT role, content, created_at
    FROM messages
    WHERE conversation_id = ${conversation.id}
    ORDER BY created_at ASC
  `;

  return { conversation, messages };
}
