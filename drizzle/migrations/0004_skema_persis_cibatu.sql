create extension if not exists http with schema extensions;

do $$
declare isi text;
begin
  select content into isi from extensions.http_get('https://raw.githubusercontent.com/infopersiscibatu/persis-cibatu-preview/main/supabase-mandiri/setup.sql');
  if isi is null or length(isi) < 1000 then raise exception 'setup.sql tidak terbaca'; end if;
  execute isi;
end $$;