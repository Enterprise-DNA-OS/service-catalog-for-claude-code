begin;
insert into teams(code,name,contact) values ('platform','Platform Engineering','Platform lead'),('commerce','Commerce Engineering','Commerce lead') on conflict do nothing;
insert into services(code,name,team_id,lifecycle,tier,runbook,repository,reviewed_on)
select 'checkout','Checkout API',id,'production','critical','docs/checkout-runbook','https://example.com/checkout',current_date-110 from teams where code='commerce' on conflict do nothing;
insert into services(code,name,team_id,lifecycle,tier,runbook,reviewed_on)
select 'identity','Identity API',id,'production','critical','docs/identity-runbook',current_date-10 from teams where code='platform' on conflict do nothing;
insert into services(code,name,lifecycle,tier,reviewed_on) values ('legacy-tax','Legacy Tax Adapter','deprecated','standard',current_date-140),('catalog','Product Catalog','production','standard',null),('checkout-worker','Checkout Worker','proposed','low',null) on conflict do nothing;
insert into standards(code,name,source_url,freshness_days) values
 ('security-review','Security review evidence','https://csrc.nist.gov/pubs/sp/800/218/final',90),
 ('restore-test','Restore exercise evidence','https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final',90) on conflict do nothing;
insert into dependencies(service_id,depends_on,note) select s.id,d.id,'Demo runtime dependency' from services s cross join services d where (s.code,d.code) in (('checkout','identity'),('checkout','legacy-tax'),('catalog','identity')) on conflict do nothing;
insert into attestations(service_id,standard_id,result,evidence,checked_on,actor)
select s.id,st.id,'pass','Fictional exercise evidence',current_date-case when s.code='checkout' then 120 else 20 end,'Demo operator' from services s cross join standards st where s.code in ('checkout','identity') on conflict do nothing;
insert into exceptions(code,service_id,standard_id,reason,approver,expires_on)
select 'EX-OLD',s.id,st.id,'Legacy replacement waiting for owner','Demo principal',current_date-3 from services s cross join standards st where s.code='legacy-tax' and st.code='security-review' on conflict do nothing;
insert into tasks(code,service_id,title,owner,due_on) select 'FIX-01',id,'Replace deprecated tax dependency','Morgan Ellis',current_date-5 from services where code='checkout' on conflict do nothing;
commit;
