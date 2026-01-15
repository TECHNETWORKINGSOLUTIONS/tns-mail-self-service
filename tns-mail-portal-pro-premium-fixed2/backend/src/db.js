
import pg from 'pg'
import { randomUUID } from 'node:crypto'

const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: +(process.env.POSTGRES_PORT||5432),
  database: process.env.POSTGRES_DB || 'tns_portal',
  user: process.env.POSTGRES_USER || 'tns_portal',
  password: process.env.POSTGRES_PASSWORD || 'change_this_password'
});

export async function runMigrations(){
  await pool.query(`create table if not exists portal_tenants (id uuid primary key, display_name text not null, created_at timestamptz default now());`)
  await pool.query(`create table if not exists portal_users (id uuid primary key, tenant_id uuid not null references portal_tenants(id) on delete cascade, sub text not null unique, email text, created_at timestamptz default now());`)
  await pool.query(`create table if not exists portal_tenant_domains (tenant_id uuid not null references portal_tenants(id) on delete cascade, domain text not null, primary key(tenant_id, domain));`)
  await pool.query(`create table if not exists portal_tenant_mailboxes (tenant_id uuid not null references portal_tenants(id) on delete cascade, mailbox text not null, primary key(tenant_id, mailbox));`)
}

export async function resolveOrCreateUser({ sub, email }){
  // naive: find existing by sub; if missing, create a tenant per user (you can reassign later)
  let r = await pool.query('select u.*, t.display_name from portal_users u join portal_tenants t on t.id=u.tenant_id where u.sub=$1', [sub]);
  if(!r.rowCount){
    const tenant_id = randomUUID();
    const user_id = randomUUID();
    await pool.query('insert into portal_tenants(id, display_name) values($1,$2)', [tenant_id, email||`Tenant ${tenant_id.slice(0,8)}`]);
    await pool.query('insert into portal_users(id, tenant_id, sub, email) values($1,$2,$3,$4)', [user_id, tenant_id, sub, email||null]);
    // NOTE: An operator should insert real domains/mailboxes later. For now empty sets.
  }
  r = await pool.query('select u.*, t.display_name from portal_users u join portal_tenants t on t.id=u.tenant_id where u.sub=$1', [sub]);
  const user = { id: r.rows[0].id, sub: r.rows[0].sub, email: r.rows[0].email };
  const tenant = { id: r.rows[0].tenant_id, display_name: r.rows[0].display_name };
  const d = await pool.query('select domain from portal_tenant_domains where tenant_id=$1', [tenant.id]);
  const m = await pool.query('select mailbox from portal_tenant_mailboxes where tenant_id=$1', [tenant.id]);
  return { user, tenant, domains: d.rows.map(x=>x.domain), mailboxes: m.rows.map(x=>x.mailbox) };
}

export const db = { resolveOrCreateUser };
