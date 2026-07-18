-- Create a read-only PostgreSQL role for the AI SQL query tool
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ai_readonly') THEN
    CREATE ROLE ai_readonly WITH LOGIN PASSWORD 'password';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO ai_readonly;
GRANT USAGE ON SCHEMA public TO ai_readonly;
GRANT SELECT ON contacts TO ai_readonly;
