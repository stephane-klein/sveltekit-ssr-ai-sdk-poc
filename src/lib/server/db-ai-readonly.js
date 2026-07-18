import postgres from "postgres";

const {
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
    POSTGRES_AI_READONLY_USER,
    POSTGRES_AI_READONLY_PASSWORD
} = process.env;

export const sqlReadonly = postgres({
    host: POSTGRES_HOST || "postgres",
    port: Number(POSTGRES_PORT) || 5432,
    database: POSTGRES_DB,
    user: POSTGRES_AI_READONLY_USER || "ai_readonly",
    password: POSTGRES_AI_READONLY_PASSWORD || "password",
    idle_timeout: 5,
    max_lifetime: 60,
});
