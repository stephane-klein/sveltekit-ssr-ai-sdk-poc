import { randomUUID } from 'node:crypto';

export function generateSlug() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const randomPart = randomUUID().split('-')[0];

  return `${datePart}_${randomPart}`;
}
