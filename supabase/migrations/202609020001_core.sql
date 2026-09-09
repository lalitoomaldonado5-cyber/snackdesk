-- Run once, in order. All application access uses the signed-in user's JWT.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 150),
  logo_url text check (logo_url is null or logo_url = id::text || '/logo'),
  phone text check (length(phone) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 1 and 150),
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_business_idx on public.profiles(business_id);
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 150),
  phone text not null check (phone ~ '^[+0-9 ().-]{7,30}$'),
  email text check (email is null or (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  notes text check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);
create index clients_business_name_idx on public.clients(business_id, name);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  client_id uuid not null,
  title text not null check (length(trim(title)) between 1 and 150),
  event_type text not null check (length(trim(event_type)) between 1 and 80),
  event_date date not null check (event_date between '1900-01-01' and '2199-12-31'),
  event_time time,
  location text check (length(location) <= 500),
  guest_count integer check (guest_count between 1 and 999999),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  status text not null default 'quoted' check (status in ('quoted','reserved','paid','completed','cancelled')),
  notes text check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, client_id) references public.clients(business_id, id) on delete restrict
);
create index events_business_date_idx on public.events(business_id, event_date);
create index events_business_status_idx on public.events(business_id, status);
create index events_client_idx on public.events(business_id, client_id);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  event_id uuid not null,
  amount numeric(10,2) not null check (amount > 0),
  payment_type text not null check (payment_type in ('deposit','partial','final')),
  payment_date date not null check (payment_date between '1900-01-01' and '2199-12-31'),
  notes text check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  foreign key (business_id, event_id) references public.events(business_id, id) on delete restrict
);
create index payments_event_idx on public.payments(business_id, event_id);
create index payments_date_idx on public.payments(business_id, payment_date);
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  event_id uuid,
  description text not null check (length(trim(description)) between 1 and 250),
  category text check (length(category) <= 80),
  amount numeric(10,2) not null check (amount > 0),
  expense_date date not null check (expense_date between '1900-01-01' and '2199-12-31'),
  notes text check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  foreign key (business_id, event_id) references public.events(business_id, id) on delete restrict
);
create index expenses_event_idx on public.expenses(business_id, event_id);
create index expenses_date_idx on public.expenses(business_id, expense_date);
create table public.service_packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 150),
  description text check (length(description) <= 2000),
  base_price numeric(10,2) not null check (base_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index packages_business_idx on public.service_packages(business_id, active);

-- Metadata may contain names, never trusted business_id or role values.
-- Auth user + business + owner profile are created in a single transaction.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare new_business_id uuid;
begin
  insert into public.businesses(name)
  values (left(coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), 'Mi negocio'),150))
  returning id into new_business_id;
  insert into public.profiles(id, business_id, full_name, role)
  values (new.id, new_business_id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Mi cuenta'),150), 'owner');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger touch_businesses before update on public.businesses for each row execute function private.touch_updated_at();
create trigger touch_profiles before update on public.profiles for each row execute function private.touch_updated_at();
create trigger touch_clients before update on public.clients for each row execute function private.touch_updated_at();
create trigger touch_events before update on public.events for each row execute function private.touch_updated_at();
create trigger touch_packages before update on public.service_packages for each row execute function private.touch_updated_at();

-- Internal helpers take NO business/user arguments, preventing impersonation.
-- Definer is needed only to read the current membership without recursive RLS.
create function private.current_business_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select business_id from public.profiles where id = (select auth.uid());
$$;
create function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'owner' from public.profiles where id = (select auth.uid())), false);
$$;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.current_business_id(), private.is_owner() to authenticated;

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.events enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.service_packages enable row level security;
revoke all on public.businesses, public.profiles, public.clients, public.events, public.payments, public.expenses, public.service_packages from public, anon, authenticated;
grant select on public.businesses, public.profiles to authenticated;
grant update(name,phone,logo_url) on public.businesses to authenticated;
grant update(full_name) on public.profiles to authenticated;
grant select,insert,update,delete on public.clients, public.events, public.payments, public.expenses, public.service_packages to authenticated;

create policy businesses_read on public.businesses for select to authenticated
using (id = (select private.current_business_id()));
create policy businesses_owner_update on public.businesses for update to authenticated
using (id = (select private.current_business_id()) and (select private.is_owner()))
with check (id = (select private.current_business_id()) and (select private.is_owner()));
create policy profiles_read on public.profiles for select to authenticated
using (business_id = (select private.current_business_id()));
create policy profiles_update_name on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()) and business_id = (select private.current_business_id()));

-- Explicit operation policies. WITH CHECK stops moving a row to another tenant.
do $$
declare t text;
begin
  foreach t in array array['clients','events','payments','expenses'] loop
    execute format('create policy %I on public.%I for select to authenticated using (business_id = (select private.current_business_id()))', t || '_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (business_id = (select private.current_business_id()))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (business_id = (select private.current_business_id())) with check (business_id = (select private.current_business_id()))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (business_id = (select private.current_business_id()))', t || '_delete', t);
  end loop;
end $$;
create policy packages_read on public.service_packages for select to authenticated using (business_id = (select private.current_business_id()));
create policy packages_insert on public.service_packages for insert to authenticated with check (business_id = (select private.current_business_id()) and (select private.is_owner()));
create policy packages_update on public.service_packages for update to authenticated using (business_id = (select private.current_business_id()) and (select private.is_owner())) with check (business_id = (select private.current_business_id()) and (select private.is_owner()));
create policy packages_delete on public.service_packages for delete to authenticated using (business_id = (select private.current_business_id()) and (select private.is_owner()));

-- Financial rules run even if callers bypass Next.js. Parent row locks serialize
-- payments for an event. Reassigning a payment is deliberately disallowed.
create function private.guard_payment() returns trigger
language plpgsql set search_path = '' as $$
declare ev public.events; other_paid numeric; target_event uuid; target_business uuid;
begin
  if tg_op = 'UPDATE' and (new.event_id <> old.event_id or new.business_id <> old.business_id) then
    raise exception 'payment_event_immutable' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then target_event := old.event_id; target_business := old.business_id;
  else target_event := new.event_id; target_business := new.business_id; end if;
  select * into ev from public.events where id = target_event and business_id = target_business for update;
  if not found then raise exception 'event_unavailable' using errcode = '23503'; end if;
  if tg_op = 'DELETE' then return old; end if;
  if ev.status = 'cancelled' then raise exception 'event_cancelled' using errcode = '23514'; end if;
  select coalesce(sum(amount),0) into other_paid from public.payments
  where event_id = target_event and business_id = target_business and id <> new.id;
  if other_paid + new.amount > ev.total_amount then raise exception 'payment_exceeds_balance' using errcode = '23514'; end if;
  return new;
end;
$$;
create trigger guard_payment before insert or update or delete on public.payments for each row execute function private.guard_payment();
create function private.guard_event_total() returns trigger
language plpgsql set search_path = '' as $$
declare paid numeric;
begin
  select coalesce(sum(amount),0) into paid from public.payments where event_id = new.id and business_id = new.business_id;
  if new.total_amount < paid then raise exception 'total_below_payments' using errcode = '23514'; end if;
  if new.status = 'paid' and new.total_amount <> paid then raise exception 'event_not_fully_paid' using errcode = '23514'; end if;
  return new;
end;
$$;
create trigger guard_event_total before insert or update on public.events for each row execute function private.guard_event_total();
create function private.sync_payment_status() returns trigger
language plpgsql set search_path = '' as $$
declare target_event uuid; target_business uuid; paid numeric;
begin
  if tg_op = 'DELETE' then target_event := old.event_id; target_business := old.business_id;
  else target_event := new.event_id; target_business := new.business_id; end if;
  select coalesce(sum(amount),0) into paid from public.payments where event_id = target_event and business_id = target_business;
  update public.events set status = case when paid = total_amount then 'paid' when paid > 0 or status = 'paid' then 'reserved' else status end
  where id = target_event and business_id = target_business and status not in ('completed','cancelled');
  return null;
end;
$$;
create trigger sync_payment_status after insert or update or delete on public.payments for each row execute function private.sync_payment_status();
revoke all on function private.guard_payment(), private.guard_event_total(), private.sync_payment_status() from public, anon, authenticated;
commit;
