create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text,
  owner_email text,
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null unique,
  name text not null,
  vertical text not null default 'restaurant',
  city text,
  whatsapp_order_phone text,
  website_url text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  created_at timestamptz not null default now()
);

create table public.assistants (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  voice_id text,
  avatar_variant text not null default 'simple_2d',
  system_prompt text not null default '',
  locale text not null default 'it-IT',
  created_at timestamptz not null default now()
);

create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  source_type text not null check (source_type in ('document', 'website', 'manual_note', 'menu')),
  title text not null,
  source_url text,
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  extracted_text text,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10, 2),
  allergens text[] not null default '{}',
  tags text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  channel text not null default 'web_widget',
  customer_name text,
  customer_phone text,
  status text not null default 'open' check (status in ('open', 'converted', 'handoff', 'closed')),
  created_at timestamptz not null default now()
);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('assistant', 'user', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  customer_name text,
  customer_phone text,
  summary text not null,
  status text not null default 'draft' check (status in ('draft', 'sent_whatsapp', 'accepted', 'cancelled')),
  created_at timestamptz not null default now()
);

create index venues_organization_id_idx on public.venues(organization_id);
create index assistants_venue_id_idx on public.assistants(venue_id);
create index knowledge_sources_venue_id_idx on public.knowledge_sources(venue_id);
create index menu_items_venue_id_idx on public.menu_items(venue_id);
create index conversations_venue_id_idx on public.conversations(venue_id);
create index conversation_messages_conversation_id_idx on public.conversation_messages(conversation_id);
create index orders_venue_id_idx on public.orders(venue_id);

alter table public.organizations enable row level security;
alter table public.venues enable row level security;
alter table public.assistants enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.menu_items enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.orders enable row level security;

-- MVP note:
-- The public widget should read tenant data through server-side API routes using
-- SUPABASE_SERVICE_ROLE_KEY. Do not expose service role credentials to browsers.
-- Add user/organization membership policies before enabling a customer dashboard.
