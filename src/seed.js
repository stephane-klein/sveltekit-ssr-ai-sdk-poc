#!/usr/bin/env node
// Utility script — loads and executes all SQL fixture files from sqls/fixtures/
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

import { logger } from "./logger.js";
import { sql, waitForDb } from "./lib/server/db.js";

await waitForDb();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadSqlDir(subdir) {
    const dir = join(__dirname, "..", "sqls", subdir);
    const files = readdirSync(dir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

    for (const file of files) {
        logger.info({ file, dir: subdir }, "Loading SQL file");
        const content = readFileSync(join(dir, file), "utf8");
        await sql.unsafe(content);
    }
}

await loadSqlDir("fixtures");
await loadSqlDir("rls");

await sql.end();