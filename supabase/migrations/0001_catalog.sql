create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table teams (id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'), name text not null check(length(trim(name))>0), contact text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger teams_updated before update on teams for each row execute function touch_updated_at();
alter table teams enable row level security;
revoke all on teams from public;
create table services (id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'), name text not null check(length(trim(name))>0), team_id uuid references teams(id), lifecycle text not null default 'proposed' check(lifecycle in ('proposed','production','deprecated','retired')), tier text not null default 'unknown' check(tier in ('critical','standard','low','unknown')), runbook text not null default '', repository text not null default '', reviewed_on date check(reviewed_on <= current_date), source text, source_id text, raw_source jsonb, unique(source,source_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger services_updated before update on services for each row execute function touch_updated_at();
alter table services enable row level security;
revoke all on services from public;
create table dependencies (id uuid primary key default gen_random_uuid(), service_id uuid not null references services(id), depends_on uuid not null references services(id), note text not null, unique(service_id,depends_on), check(service_id<>depends_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger dependencies_updated before update on dependencies for each row execute function touch_updated_at();
alter table dependencies enable row level security;
revoke all on dependencies from public;
create table standards (id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'), name text not null, source_url text not null, freshness_days integer not null default 90 check(freshness_days between 1 and 3660), active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger standards_updated before update on standards for each row execute function touch_updated_at();
alter table standards enable row level security;
revoke all on standards from public;
create table attestations (id uuid primary key default gen_random_uuid(), service_id uuid not null references services(id), standard_id uuid not null references standards(id), result text not null check(result in ('pass','fail')), evidence text not null check(length(trim(evidence))>0), checked_on date not null check(checked_on <= current_date), actor text not null check(length(trim(actor))>0), unique(service_id,standard_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger attestations_updated before update on attestations for each row execute function touch_updated_at();
alter table attestations enable row level security;
revoke all on attestations from public;
create table exceptions (id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'), service_id uuid not null references services(id), standard_id uuid not null references standards(id), reason text not null check(length(trim(reason))>0), approver text not null check(length(trim(approver))>0), expires_on date not null, closed boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger exceptions_updated before update on exceptions for each row execute function touch_updated_at();
alter table exceptions enable row level security;
revoke all on exceptions from public;
create table tasks (id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'), service_id uuid not null references services(id), title text not null check(length(trim(title))>0), owner text not null check(length(trim(owner))>0), due_on date not null, status text not null default 'open' check(status in ('open','done')), resolution text not null default '', check(status<>'done' or length(trim(resolution))>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger tasks_updated before update on tasks for each row execute function touch_updated_at();
alter table tasks enable row level security;
revoke all on tasks from public;
create table notes (id uuid primary key default gen_random_uuid(), service_id uuid not null references services(id), actor text not null, body text not null check(length(trim(body))>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger notes_updated before update on notes for each row execute function touch_updated_at();
alter table notes enable row level security;
revoke all on notes from public;

create table audit_events(id uuid primary key default gen_random_uuid(), actor text not null, action text not null, entity_id uuid, detail jsonb not null, created_at timestamptz not null default now());
alter table audit_events enable row level security;
revoke all on audit_events from public;
create function protect_audit() returns trigger language plpgsql as $$ begin raise exception 'Audit events are append-only'; end $$;
create trigger audit_immutable before update or delete on audit_events for each row execute function protect_audit();
create index dependencies_reverse on dependencies(depends_on);
create index tasks_service on tasks(service_id);
create view catalog as select s.id,s.code,s.name,coalesce(t.code,'UNASSIGNED') as team,s.lifecycle,s.tier,s.reviewed_on,s.runbook,s.repository from services s left join teams t on t.id=s.team_id;
create view scorecard as
 select s.id as service_id,s.code as service,st.id as standard_id,st.code as standard,
 case when a.id is null then 'missing' when a.checked_on+st.freshness_days<current_date then 'stale' else a.result end as result,
 a.checked_on,a.evidence,
 exists(select 1 from exceptions e where e.service_id=s.id and e.standard_id=st.id and not e.closed and e.expires_on>=current_date) as has_exception
 from services s cross join standards st left join attestations a on a.service_id=s.id and a.standard_id=st.id
 where s.lifecycle<>'retired' and st.active;
create view attention as
 select s.code as service,'ownership' as kind,'No responsible team' as issue from services s where s.team_id is null and s.lifecycle<>'retired'
 union all select code,'review','Ownership review overdue or missing' from services where lifecycle<>'retired' and (reviewed_on is null or reviewed_on<current_date-90)
 union all select service,'standard',standard||': '||result from scorecard where result<>'pass' and not has_exception
 union all select s.code,'exception',e.code||': exception expired' from exceptions e join services s on s.id=e.service_id where not e.closed and e.expires_on<current_date
 union all select s.code,'task',t.code||': '||t.title from tasks t join services s on s.id=t.service_id where t.status='open' and t.due_on<current_date;
create view dependency_risk as select s.code as service,d.code as dependency,d.lifecycle,d.tier,
 case when d.lifecycle in ('retired','deprecated') then 'Dependency '||d.lifecycle when d.team_id is null then 'Dependency has no owner' else 'Review dependency standards' end as risk
 from dependencies x join services s on s.id=x.service_id join services d on d.id=x.depends_on
 where s.lifecycle<>'retired' and (d.lifecycle in ('retired','deprecated') or d.team_id is null or exists(select 1 from scorecard sc where sc.service_id=d.id and sc.result<>'pass' and not sc.has_exception));
create view compliance_checks as
 select code as service,'NIST-PO.2' as rule,'Responsible team missing' as issue from services where lifecycle<>'retired' and team_id is null
 union all select code,'NIST-PW.1.2','Runbook or design evidence reference missing' from services where lifecycle='production' and runbook=''
 union all select service,'NIST-PO.4',standard||': '||result||case when has_exception then ' (exception recorded, not passed)' else '' end from scorecard where result<>'pass'
 union all select service,'NIST-PW.4.4',risk||': '||dependency from dependency_risk;
