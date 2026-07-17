import { redirect } from '@sveltejs/kit';
import { sql } from '../../db.js';
import { generateSlug } from '$lib/slug.js';

export async function load() {
  const conversations = await sql`
    SELECT slug, title, updated_at
    FROM conversations
    ORDER BY updated_at DESC
  `;

  return { conversations };
}

export const actions = {
  default: async () => {
    const slug = generateSlug();

    await sql`
      INSERT INTO conversations (slug) VALUES (${slug})
    `;

    throw redirect(303, `/chats/${slug}`);
  },
};
