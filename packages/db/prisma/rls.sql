-- InkVision — Row-Level Security (Camada 2 do isolamento multi-tenant).
-- Idempotente: pode ser reaplicado. Rode APÓS `prisma migrate deploy`.
-- Contexto por transação (set_config, is_local=true):
--   app.current_studio_id  → definido por withStudio()  (lado do estúdio)
--   app.current_user_id    → definido por withUser()    (cliente dono)
--
-- Três grupos:
--  1) STUDIO_ONLY: isolamento total por tenant (StudioMember, AiUsageLog).
--  2) STUDIO_OR_OWNER: tabelas privadas que também pertencem a um cliente
--     (Order, Conversation, Payment, Appointment, Review) — visíveis pelo tenant
--     OU pelo cliente dono (clientId = app.current_user_id).
--  3) PUBLIC_READ: ArtistProfile, PortfolioItem — SELECT liberado, escrita tenant.
-- FORCE garante que a política vale até para o owner das tabelas (o usuário do app).

DO $$
DECLARE
  t text;
  studio_only text[] := ARRAY['StudioMember', 'AiUsageLog', 'Payment'];
  studio_or_owner text[] := ARRAY['Order', 'Conversation', 'Appointment'];
  public_read text[] := ARRAY['ArtistProfile', 'PortfolioItem', 'Review'];
BEGIN
  -- Grupo 1: apenas tenant (admin pode LER via app.is_admin).
  FOREACH t IN ARRAY studio_only LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
        USING (
          "studioId" = current_setting('app.current_studio_id', true)
          OR current_setting('app.is_admin', true) = 'true'
        )
        WITH CHECK ("studioId" = current_setting('app.current_studio_id', true));
    $f$, t);
  END LOOP;

  -- Grupo 2: tenant OU cliente dono (admin pode LER).
  FOREACH t IN ARRAY studio_or_owner LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_or_owner ON %I;', t);
    EXECUTE format($f$
      CREATE POLICY tenant_or_owner ON %I
        USING (
          "studioId" = current_setting('app.current_studio_id', true)
          OR "clientId" = current_setting('app.current_user_id', true)
          OR current_setting('app.is_admin', true) = 'true'
        )
        WITH CHECK (
          "studioId" = current_setting('app.current_studio_id', true)
          OR "clientId" = current_setting('app.current_user_id', true)
        );
    $f$, t);
  END LOOP;

  -- Grupo 3: público-legíveis.
  FOREACH t IN ARRAY public_read LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS public_read ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_insert ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_update ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_delete ON %I;', t);
    EXECUTE format('CREATE POLICY public_read ON %I FOR SELECT USING (true);', t);
    EXECUTE format($f$
      CREATE POLICY tenant_insert ON %I FOR INSERT
        WITH CHECK ("studioId" = current_setting('app.current_studio_id', true));
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY tenant_update ON %I FOR UPDATE
        USING ("studioId" = current_setting('app.current_studio_id', true))
        WITH CHECK ("studioId" = current_setting('app.current_studio_id', true));
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY tenant_delete ON %I FOR DELETE
        USING ("studioId" = current_setting('app.current_studio_id', true));
    $f$, t);
  END LOOP;
END $$;
