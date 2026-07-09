-- Personel mevcut cari kartini duzenleyebilir, ancak acilis bakiyesini degistiremez.
-- Yeni cari eklerken acilis bakiyesi girebilir; kisit sadece mevcut cari update islemi icindir.

create or replace function public.on_muhasebe_prevent_staff_opening_balance_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  select membership.role
    into current_role
  from public.on_muhasebe_company_users membership
  where membership.company_id = old.company_id
    and membership.user_id = auth.uid()
    and membership.status = 'active'
  limit 1;

  if current_role = 'staff'
    and (
      coalesce(old.acilis_bakiyesi, 0) is distinct from coalesce(new.acilis_bakiyesi, 0)
      or coalesce(old.acilis_bakiye_tipi, '') is distinct from coalesce(new.acilis_bakiye_tipi, '')
    )
  then
    raise exception 'Personel mevcut cari acilis bakiyesini degistiremez.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_muhasebe_staff_opening_balance_guard
  on public.cari_hesaplar;

create trigger on_muhasebe_staff_opening_balance_guard
before update of acilis_bakiyesi, acilis_bakiye_tipi
on public.cari_hesaplar
for each row
execute function public.on_muhasebe_prevent_staff_opening_balance_change();
