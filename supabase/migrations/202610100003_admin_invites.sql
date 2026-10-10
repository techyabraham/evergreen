create table public.admin_invites (
 id uuid primary key default gen_random_uuid(),
 email text not null check (email=lower(trim(email)) and length(email)<=254),
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 created_by uuid not null references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 used_at timestamptz,
 used_by uuid references auth.users(id) on delete set null,
 check (expires_at>created_at)
);

alter table public.admin_invites enable row level security;
revoke all on public.admin_invites from public,anon;
grant select,insert,update,delete on public.admin_invites to authenticated;
create policy admin_invites_admin_only on public.admin_invites
 for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.accept_admin_invite_for_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare invite_id uuid; invite_name text;
begin
 if new.email is null then return new; end if;
 select i.id into invite_id
 from public.admin_invites i
 where i.token_hash=new.raw_user_meta_data->>'evergreen_admin_invite_hash'
  and i.email=lower(new.email)
  and i.used_at is null
  and i.expires_at>now()
 for update;
 if invite_id is null then return new; end if;

 update public.admin_invites set used_at=now(),used_by=new.id where id=invite_id;
 invite_name:=nullif(trim(coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name','')),'');
 insert into public.profiles(id,display_name,email,role)
 values(new.id,invite_name,lower(new.email),'admin')
 on conflict(id) do nothing;
 return new;
end $$;

revoke all on function public.accept_admin_invite_for_new_user() from public,anon,authenticated;
drop trigger if exists auth_user_accept_admin_invite on auth.users;
create trigger auth_user_accept_admin_invite
 after insert on auth.users
 for each row execute function public.accept_admin_invite_for_new_user();

create or replace function public.check_admin_invite(p_email text,p_token_hash text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.admin_invites i
  where i.email=lower(trim(p_email)) and i.token_hash=p_token_hash
   and i.used_at is null and i.expires_at>now()
 )
$$;
revoke all on function public.check_admin_invite(text,text) from public;
grant execute on function public.check_admin_invite(text,text) to anon,authenticated;
