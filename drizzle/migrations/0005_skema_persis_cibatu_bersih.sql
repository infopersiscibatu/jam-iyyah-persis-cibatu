create extension if not exists http with schema extensions;

do $$
declare isi text;
begin
  select content into isi from extensions.http_get('https://raw.githubusercontent.com/infopersiscibatu/persis-cibatu-preview/main/supabase-mandiri/setup.sql');
  if isi is null or length(isi) < 1000 then raise exception 'setup.sql tidak terbaca'; end if;
  execute isi;
end $$;

do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on public.%I from anon, authenticated', t.tablename);
    execute format('grant all on public.%I to service_role', t.tablename);
    execute format('truncate table public.%I restart identity cascade', t.tablename);
  end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;