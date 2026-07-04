-- Cria o role da aplicação (NÃO-superusuário, NOBYPASSRLS) para que o RLS
-- realmente valha. Em produção, o app SEMPRE conecta com um role assim — nunca
-- com o superusuário (superusuários ignoram RLS).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'inkvision_app') THEN
    CREATE ROLE inkvision_app LOGIN PASSWORD 'inkvision_app' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO inkvision_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO inkvision_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO inkvision_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO inkvision_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO inkvision_app;
