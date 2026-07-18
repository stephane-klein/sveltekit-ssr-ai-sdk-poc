#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { sql, waitForDb } from "../src/lib/server/db.js";

await waitForDb();

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "sqls/schema.sql");

const content = readFileSync(schemaPath, "utf8");
await sql.unsafe(content);
console.log("Schema loaded");

await sql.end();
