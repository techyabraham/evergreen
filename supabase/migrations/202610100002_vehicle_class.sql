alter table public.vehicle_details
 add column if not exists vehicle_class text;

do $$
begin
 if not exists(select 1 from pg_constraint where conname='vehicle_details_class_check' and conrelid='public.vehicle_details'::regclass) then
  alter table public.vehicle_details
   add constraint vehicle_details_class_check
   check (vehicle_class is null or vehicle_class in ('car','suv','truck','bus','van','motorcycle','tricycle','commercial','other'));
 end if;
end $$;
