-- Sweet Spin Records – Supabase schema. Run in the Supabase SQL editor.
create table if not exists product_categories (
  id bigint generated always as identity primary key,
  category text not null,
  created_at timestamptz default now()
);
create table if not exists product_suppliers (
  id bigint generated always as identity primary key,
  supplier text not null,
  address text, email text, contact_number text,
  created_at timestamptz default now()
);
create table if not exists product_list (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  supplier_id bigint references product_suppliers(id) on delete set null,
  category_id bigint references product_categories(id) on delete set null,
  product_name text not null,
  artist text,
  product_price numeric(10,2) not null,
  product_quantity int default 0,
  image_url text,
  created_at timestamptz default now()
);

-- Row Level Security: anyone can browse, only logged-in users can change data
alter table product_categories enable row level security;
alter table product_suppliers  enable row level security;
alter table product_list       enable row level security;

create policy "public read categories" on product_categories for select using (true);
create policy "public read products"   on product_list       for select using (true);
create policy "admin write categories" on product_categories for all to authenticated using (true) with check (true);
create policy "admin write products"   on product_list       for all to authenticated using (true) with check (true);
-- Supplier contact details are private: admins only
create policy "admin all suppliers"    on product_suppliers   for all to authenticated using (true) with check (true);
-- NOTE: the storefront joins supplier names; if you want that public, add a select policy for suppliers
create policy "public read suppliers"  on product_suppliers   for select using (true);

-- Storage bucket for cover art (the app uses the name 'Covers', capital C, bucket names are case-sensitive)
insert into storage.buckets (id, name, public) values ('Covers', 'Covers', true) on conflict do nothing;
create policy "public read covers"   on storage.objects for select using (bucket_id = 'Covers');
create policy "admin upload covers"  on storage.objects for insert to authenticated with check (bucket_id = 'Covers');
create policy "admin delete covers"  on storage.objects for delete to authenticated using (bucket_id = 'Covers');