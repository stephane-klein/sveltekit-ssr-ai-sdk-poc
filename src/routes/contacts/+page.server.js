import { sql } from '../../db.js';

export async function load() {
  const contacts = await sql`
    SELECT id, firstname, lastname, created_at
    FROM contacts
    ORDER BY lastname, firstname
  `;
  return { contacts };
}
