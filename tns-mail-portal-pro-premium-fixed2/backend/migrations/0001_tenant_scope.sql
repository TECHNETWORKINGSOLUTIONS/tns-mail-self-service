
-- portal tenant scope schema
create table if not exists portal_tenants (
  id uuid primary key,
  display_name text not null,
  created_at timestamptz default now()
);
create table if not exists portal_users (
  id uuid primary key,
  tenant_id uuid not null references portal_tenants(id) on delete cascade,
  sub text not null unique,
  email text,
  created_at timestamptz default now()
);
create table if not exists portal_tenant_domains (
  tenant_id uuid not null references portal_tenants(id) on delete cascade,
  domain text not null,
  primary key(tenant_id, domain)
);
create table if not exists portal_tenant_mailboxes (
  tenant_id uuid not null references portal_tenants(id) on delete cascade,
  mailbox text not null,
  primary key(tenant_id, mailbox)
);
-- seed example tenant + user mapping (replace with real values)
-- insert into portal_tenants (id, display_name) values ('00000000-0000-0000-0000-000000000001','Example Tenant');
-- insert into portal_users (id, tenant_id, sub, email) values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000001','fusionauth-sub-123','user@example.com');
-- insert into portal_tenant_domains (tenant_id, domain) values ('00000000-0000-0000-0000-000000000001','example.com');
-- insert into portal_tenant_mailboxes (tenant_id, mailbox) values ('00000000-0000-0000-0000-000000000001','admin@example.com');
