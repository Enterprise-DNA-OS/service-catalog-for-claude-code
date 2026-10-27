create unique index teams_code_case on teams(lower(code));
create unique index services_code_case on services(lower(code));
create unique index standards_code_case on standards(lower(code));
create unique index exceptions_code_case on exceptions(lower(code));
create unique index tasks_code_case on tasks(lower(code));
