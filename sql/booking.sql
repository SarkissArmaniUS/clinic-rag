create table if not exists doctors (
  id bigint generated always as identity primary key,
  name text not null unique,
  specialty text not null,
  treats text not null,
  work_days int[] not null,
  start_hour int not null,
  end_hour int not null
);

create table if not exists slots (
  id bigint generated always as identity primary key,
  doctor_id bigint not null references doctors(id),
  starts_at timestamptz not null,
  is_booked boolean not null default false,
  unique (doctor_id, starts_at)
);

create table if not exists appointments (
  id bigint generated always as identity primary key,
  slot_id bigint not null unique references slots(id),
  patient_name text not null,
  patient_phone text not null,
  created_at timestamptz not null default now()
);

alter table doctors enable row level security;
alter table slots enable row level security;
alter table appointments enable row level security;

insert into doctors (name, specialty, treats, work_days, start_hour, end_hour) values
    ('Dr. Emily Carter', 'General Dentist, Head Physician', 'cavity treatment, pulpitis, toothache, fillings, consultation', '{2,4,5}', 9, 17),
    ('Dr. Michael Brooks', 'Oral Surgeon and Implantologist', 'dental implants, tooth extraction, surgical procedures', '{1,3,6}', 10, 16),
    ('Dr. Sophie Turner', 'Pediatric Dentist', 'check-ups and treatment for children from age 3', '{1,2,3,4,5}', 10, 15),
    ('Dr. Daniel Reed', 'Prosthodontist', 'dentures, crowns, bridges, prosthetics', '{2,4}', 10, 18),
    ('Maria Stevens', 'Dental Hygienist', 'professional cleaning, teeth cleaning, whitening', '{1,2,3,4,5}', 9, 18)
on conflict (name) do nothing;

create or replace function seed_demo_slots(days_ahead int default 14)
returns int
language plpgsql
as $$
declare
  n int;
begin
  delete from slots where starts_at < now() - interval '1 day' and is_booked = false;

  insert into slots (doctor_id, starts_at)
  select d.id, (day + make_interval(hours => h)) at time zone 'Europe/Kyiv'
  from doctors d
  cross join generate_series(
    (current_date + 1)::timestamp,
    (current_date + days_ahead)::timestamp,
    interval '1 day'
  ) as day
  cross join lateral generate_series(d.start_hour, d.end_hour - 1) as h
  where extract(isodow from day)::int = any(d.work_days)
  on conflict (doctor_id, starts_at) do nothing;

  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function book_slot(p_slot_id bigint, p_name text, p_phone text)
returns table (out_appointment_id bigint, out_doctor_name text, out_starts_at timestamptz)
language plpgsql
as $$
declare
  v_doctor_id bigint;
  v_start timestamptz;
  v_appt_id bigint;
  v_doctor_name text;
begin
  update slots
  set is_booked = true
  where id = p_slot_id and is_booked = false and slots.starts_at > now()
  returning slots.doctor_id, slots.starts_at into v_doctor_id, v_start;

  if not found then
    return;
  end if;

  insert into appointments (slot_id, patient_name, patient_phone)
  values (p_slot_id, p_name, p_phone)
  returning id into v_appt_id;

  select d.name into v_doctor_name from doctors d where d.id = v_doctor_id;

  return query select v_appt_id, v_doctor_name, v_start;
end;
$$;

grant usage on schema public to service_role;
grant select on table doctors to service_role;
grant select, update, insert, delete on table slots to service_role;
grant select, insert on table appointments to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function seed_demo_slots(int) to service_role;
grant execute on function book_slot(bigint, text, text) to service_role;

select seed_demo_slots();
