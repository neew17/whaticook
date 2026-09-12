# push-dispatch

Roda os 5 gatilhos da matriz de push (ver `docs/` ou a auditoria de UX): primeira receita,
streak em risco, ingrediente parado, dormência, social agregado. Chamada por um cron do
próprio Postgres (`pg_cron` + `pg_net`), nunca pelo cliente do app.

## Deploy

```bash
supabase functions deploy push-dispatch --no-verify-jwt
```

`--no-verify-jwt` porque quem chama é o `pg_net` do banco, não um usuário logado — a
proteção real é o header `x-cron-secret` conferido dentro da função.

## Secrets necessários (uma vez)

```bash
supabase secrets set CRON_SECRET=<gerar um valor aleatório>
supabase secrets set VAPID_PUBLIC_KEY=<chave pública VAPID>
supabase secrets set VAPID_PRIVATE_KEY=<chave privada VAPID>
```

## Agendar o cron (uma vez, rodar direto no SQL Editor do painel — não vira migration
porque o `CRON_SECRET` não pode ficar commitado no repo)

```sql
select cron.schedule(
  'push-dispatch-every-30min',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/push-dispatch',
    headers := jsonb_build_object('x-cron-secret', '<o mesmo valor do CRON_SECRET>'),
    body := '{}'::jsonb
  );
  $$
);
```

Pra conferir se está agendado: `select * from cron.job;`
Pra remover: `select cron.unschedule('push-dispatch-every-30min');`
