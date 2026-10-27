#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const COMMANDS=['help','teams','services','show','owner-review','scorecards','dependency-risk','exceptions-due','remediation','attention','compliance','insights','history','add-team','add','update','assign','review','lifecycle','link','add-standard','attest','except','close-exception','add-task','complete-task','log','import','export','weekly-review','draft-handover'];
const domainTables=['teams','services','dependencies','standards','attestations','exceptions','tasks','notes','audit_events'];
const reads={
 teams:'select code,name,contact from teams order by code',
 services:'select code,name,team,lifecycle,tier,reviewed_on from catalog order by code',
 'owner-review':"select code,name,team,reviewed_on from catalog where lifecycle<>'retired' and (team='UNASSIGNED' or reviewed_on is null or reviewed_on<current_date-90) order by code",
 scorecards:'select service,standard,result,checked_on,has_exception from scorecard order by service,standard',
 'dependency-risk':'select * from dependency_risk order by service,dependency',
 'exceptions-due':"select e.code,s.code as service,st.code as standard,e.approver,e.expires_on,case when e.expires_on<current_date then 'expired' else 'due soon' end as state from exceptions e join services s on s.id=e.service_id join standards st on st.id=e.standard_id where not e.closed and e.expires_on<=current_date+30 order by e.expires_on,e.code",
 remediation:"select t.code,s.code as service,t.title,t.owner,t.due_on,t.status from tasks t join services s on s.id=t.service_id where t.status='open' order by t.due_on,t.code",
 attention:'select * from attention order by service,kind,issue',
 compliance:'select * from compliance_checks order by service,rule,issue'
};
export const QUESTIONS=[
 ['Which critical services lack a responsible team?',"select code,name from services where lifecycle<>'retired' and tier='critical' and team_id is null"],
 ['Which production services depend directly on deprecated or retired services?',"select * from dependency_risk where lifecycle in ('deprecated','retired') and service in (select code from services where lifecycle='production')"],
 ['Which services have stale evidence despite a recorded pass?',"select service,standard,checked_on from scorecard where result='stale'"],
 ['Which standards have never been assessed for each service?',"select service,standard from scorecard where result='missing'"],
 ['Which exceptions expired while their checks still failed or lacked evidence?',"select e.code,s.code as service,sc.standard,sc.result from exceptions e join services s on s.id=e.service_id join scorecard sc on sc.service_id=e.service_id and sc.standard_id=e.standard_id where not e.closed and e.expires_on<current_date and sc.result<>'pass'"],
 ['Which teams own services with overdue remediation?',"select c.team,t.code,c.code as service,t.due_on from tasks t join catalog c on c.id=t.service_id where t.status='open' and t.due_on<current_date"],
 ['Which services have an exception but still lack a runbook?',"select distinct s.code from exceptions e join services s on s.id=e.service_id where not e.closed and e.expires_on>=current_date and s.runbook=''"],
 ['Which production services have no dependency records?',"select s.code from services s where s.lifecycle='production' and not exists(select 1 from dependencies d where d.service_id=s.id)"],
 ['Which imported services still await an ownership review?',"select code,source,source_id from services where source is not null and reviewed_on is null"],
 ['Which services combine overdue ownership reviews with open remediation?',"select c.code,c.team,t.code as task from catalog c join tasks t on t.service_id=c.id where c.lifecycle<>'retired' and (c.reviewed_on is null or c.reviewed_on<current_date-90) and t.status='open'"]
];
function argsOf(args){const flags={},pos=[];for(const a of args){if(a.startsWith('--')){const [k,...v]=a.slice(2).split('=');if(k in flags)throw Error(`Duplicate flag --${k}`);flags[k]=v.length?v.join('='):true;}else pos.push(a);}return {flags,pos};}
function required(v,label){if(typeof v!=='string'||!v.trim())throw Error(`${label} is required`);return v.trim();}
function code(v){v=required(v,'code');if(!/^[A-Za-z0-9_-]+$/.test(v))throw Error('Codes use letters, digits, underscores and hyphens');return v;}
function date(v,label='date'){v=required(v,label);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error(`Invalid ${label}`);return v;}
function oneOf(v,values,label){if(!values.includes(v))throw Error(`${label}: choose ${values.join(', ')}`);return v;}
async function resolve(db,kind,ref){required(ref,kind);const exact=await db.query(`select * from ${kind} where lower(code)=lower($1) or id::text=$1`,[ref]);if(exact.length===1)return exact[0];const rows=await db.query(`select * from ${kind} where starts_with(id::text,lower($1)) or strpos(lower(code),lower($1))>0 ${['services','teams','standards'].includes(kind)?'or strpos(lower(name),lower($1))>0':''} order by code`,[ref]);if(rows.length!==1)throw Error(`${kind} reference ${JSON.stringify(ref)}: ${rows.length?'ambiguous: '+rows.map(x=>`${x.code} (${x.id})`).join(', '):'not found'}`);return rows[0];}
async function audit(db,actor,action,id,detail){await db.query('insert into audit_events(actor,action,entity_id,detail) values($1,$2,$3,$4)',[actor,action,id,JSON.stringify(detail)]);}
async function tx(db,fn){await db.exec('BEGIN');try{await db.exec("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");const result=await fn();await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
function save(relative,content){const out=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,relative);fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});fs.writeFileSync(out,content,{mode:0o600});fs.chmodSync(out,0o600);return out;}
function display(rows){if(!rows.length)return '(none)';return table(rows,Object.keys(rows[0]).map(key=>({key,label:key,format:v=>v!==null&&typeof v==='object'?JSON.stringify(v):v})));}
export async function run(db,args){
 const {flags:f,pos:p}=argsOf(args);const cmd=p.shift()||'help';if(!COMMANDS.includes(cmd))throw Error(`Unknown command ${cmd}. Use help.`);
 if(cmd==='help')return COMMANDS.map(command=>({command}));
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='insights'){const out=[];for(let i=0;i<QUESTIONS.length;i++)out.push({number:i+1,question:QUESTIONS[i][0],rows:await db.query(QUESTIONS[i][1])});return out;}
 if(cmd==='show'){const s=await resolve(db,'services',p[0]);return {service:s,dependencies:await db.query('select d.code,d.name,x.note from dependencies x join services d on d.id=x.depends_on where x.service_id=$1',[s.id]),standards:await db.query('select * from scorecard where service_id=$1',[s.id]),notes:await db.query('select actor,body,created_at from notes where service_id=$1 order by created_at',[s.id])};}
 if(cmd==='history'){const s=await resolve(db,'services',p[0]);return db.query('select actor,action,detail,created_at from audit_events where entity_id=$1 order by created_at,id',[s.id]);}
 if(cmd==='export'){
  return tx(db,async()=>{const out={format:'service-catalog-v1',exported_at:new Date().toISOString(),records:{}};for(const t of domainTables)out.records[t]=await db.query(`select * from ${t} order by id`);
   if(f.format==='csv'){const rows=await db.query('select code,name,team,lifecycle,tier,reviewed_on from catalog order by code');const keys=['code','name','team','lifecycle','tier','reviewed_on'];const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,x=>"'"+x).replaceAll('"','""')+'"';return {file:save(required(f.out,'--out'),[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n'),count:rows.length};}
   if(f.format&&f.format!=='json')throw Error('Export format must be json or csv');if(f.out)return {file:save(required(f.out,'--out'),JSON.stringify(out,null,2)+'\n'),count:out.records.services.length};return out;});
 }
 if(cmd==='weekly-review'||cmd==='draft-handover'){
  let title,body;if(cmd==='weekly-review'){title='Weekly service ownership review';body='';for(const name of ['owner-review','dependency-risk','attention'])body+=`\n## ${name}\n\n\`\`\`text\n${display(await db.query(reads[name]))}\n\`\`\`\n`;}
  else{const s=await resolve(db,'services',p[0]);title=`Handover: ${s.name}`;body=`\n${display(await db.query('select * from catalog where id=$1',[s.id]))}\n\nStandards\n${display(await db.query('select standard,result,has_exception from scorecard where service_id=$1',[s.id]))}\n\nOpen tasks\n${display(await db.query("select code,title,owner,due_on from tasks where service_id=$1 and status='open'",[s.id]))}`;}
  return {file:save(`drafts/${cmd}-${Date.now()}.md`,`# ${title}\n\nDraft for internal review. No messages sent.\n${body}\n`)};
 }
 const actor=required(f.actor,'--actor');
 return tx(db,async()=>{
  let result,id;
  if(cmd==='add-team'){[result]=await db.query('insert into teams(code,name,contact) values($1,$2,$3) returning *',[code(f.code),required(f.name,'--name'),f.contact||'']);id=result.id;}
  else if(cmd==='add'){
   const team=f.team?(await resolve(db,'teams',f.team)).id:null;
   [result]=await db.query('insert into services(code,name,team_id,lifecycle,tier,runbook,repository) values($1,$2,$3,$4,$5,$6,$7) returning *',[code(f.code),required(f.name,'--name'),team,oneOf(f.lifecycle||'proposed',['proposed','production','deprecated','retired'],'lifecycle'),oneOf(f.tier||'unknown',['critical','standard','low','unknown'],'tier'),f.runbook||'',f.repository||'']);id=result.id;
  }else if(cmd==='add-standard'){
   const days=Number(f.days||90);if(!Number.isInteger(days)||days<1||days>3660)throw Error('days must be an integer from 1 to 3660');const source=required(f.source,'--source');if(!/^https:\/\//.test(source))throw Error('standard source requires an https reference');
   [result]=await db.query('insert into standards(code,name,source_url,freshness_days) values($1,$2,$3,$4) returning *',[code(f.code),required(f.name,'--name'),source,days]);id=result.id;
  }else if(cmd==='close-exception'){const e=await resolve(db,'exceptions',p[0]);required(f.note,'--note');if(e.closed)throw Error('Exception already closed');[result]=await db.query('update exceptions set closed=true where id=$1 returning *',[e.id]);id=e.service_id;}
  else if(cmd==='complete-task'){const t=await resolve(db,'tasks',p[0]);if(t.status==='done')throw Error('Task already done');[result]=await db.query("update tasks set status='done',resolution=$2 where id=$1 returning *",[t.id,required(f.note,'--note')]);id=t.service_id;}
  else if(cmd==='import'){result=await importPort(db,p,f,actor);return result;}
  else {
   const s=await resolve(db,'services',p[0]);id=s.id;
   if(cmd==='update'){
    const fields=['name','tier','runbook','repository'].filter(k=>k in f);
    if(!fields.length)throw Error('Update needs --name, --tier, --runbook or --repository');
    if('name' in f)required(f.name,'--name');
    if('tier' in f)oneOf(f.tier,['critical','standard','low','unknown'],'tier');
    if(fields.some(k=>typeof f[k]!=='string'))throw Error('Update values must be strings');
    if(s.lifecycle==='production'&&'runbook' in f&&!f.runbook.trim())throw Error('Production requires a runbook reference');
    [result]=await db.query(`update services set ${fields.map((k,i)=>`${k}=$${i+2}`).join(',')} where id=$1 returning *`,[s.id,...fields.map(k=>f[k])]);
   }
   else if(cmd==='assign'){const team=await resolve(db,'teams',required(f.team,'--team'));[result]=await db.query('update services set team_id=$2,reviewed_on=null where id=$1 returning *',[s.id,team.id]);}
   else if(cmd==='review'){if(!s.team_id)throw Error('Assign an accountable team before review');required(f.note,'--note');[result]=await db.query('update services set reviewed_on=current_date where id=$1 returning *',[s.id]);}
   else if(cmd==='lifecycle'){const state=oneOf(f.state,['proposed','production','deprecated','retired'],'state');required(f.note,'--note');if(state==='retired'){const users=await db.query("select s.code from dependencies d join services s on s.id=d.service_id where d.depends_on=$1 and s.lifecycle<>'retired'",[s.id]);if(users.length)throw Error('Active dependants: '+users.map(x=>x.code).join(', '));}if(state==='production'&&(!s.team_id||!s.runbook))throw Error('Production requires a responsible team and runbook reference');[result]=await db.query('update services set lifecycle=$2 where id=$1 returning *',[s.id,state]);}
   else if(cmd==='link'){const d=await resolve(db,'services',required(f.to,'--to'));[result]=await db.query('insert into dependencies(service_id,depends_on,note) values($1,$2,$3) returning *',[s.id,d.id,required(f.note,'--note')]);}
   else if(cmd==='attest'){const st=await resolve(db,'standards',required(f.standard,'--standard'));[result]=await db.query('insert into attestations(service_id,standard_id,result,evidence,checked_on,actor) values($1,$2,$3,$4,$5,$6) on conflict(service_id,standard_id) do update set result=excluded.result,evidence=excluded.evidence,checked_on=excluded.checked_on,actor=excluded.actor returning *',[s.id,st.id,oneOf(f.result,['pass','fail'],'result'),required(f.evidence,'--evidence'),date(f.date,'--date'),actor]);}
   else if(cmd==='except'){const st=await resolve(db,'standards',required(f.standard,'--standard'));const expires=date(f.expires,'--expires');if(expires<new Date().toISOString().slice(0,10))throw Error('New exception expiry cannot be in the past');[result]=await db.query('insert into exceptions(code,service_id,standard_id,reason,approver,expires_on) values($1,$2,$3,$4,$5,$6) returning *',[code(f.code),s.id,st.id,required(f.reason,'--reason'),required(f.approver,'--approver'),expires]);}
   else if(cmd==='add-task'){[result]=await db.query('insert into tasks(code,service_id,title,owner,due_on) values($1,$2,$3,$4,$5) returning *',[code(f.code),s.id,required(f.title,'--title'),required(f.owner,'--owner'),date(f.due,'--due')]);}
   else if(cmd==='log'){[result]=await db.query('insert into notes(service_id,actor,body) values($1,$2,$3) returning *',[s.id,actor,required(f.note,'--note')]);}
   else throw Error(`Unhandled command ${cmd}`);
  }
  await audit(db,actor,cmd,id,{record:result,note:f.note||null});return result;
 });
}
async function importPort(db,p,f,actor){
 if(p[0]!=='port')throw Error('Import source must be port');const source=required(f.source,'--source');const file=required(p[1],'CSV path');const rows=parseCsv(fs.readFileSync(file,'utf8'));if(!rows.length)throw Error('CSV has no records');
 const mapping=f.map?JSON.parse(fs.readFileSync(required(f.map,'--map'),'utf8')):{};
 const allowed=['code','name','team','lifecycle','tier','runbook','repository'];if(Object.keys(mapping).some(k=>!allowed.includes(k))||Object.values(mapping).some(v=>typeof v!=='string'||!v.trim()))throw Error('Mapping must contain supported field names and nonempty column names');
 const defaults={code:'Identifier',name:'Title',team:'Team',lifecycle:'Lifecycle',tier:'Tier',runbook:'Runbook',repository:'Repository'};
 const column=k=>mapping[k]||defaults[k];const get=(row,k)=>pick(row,column(k)).trim();
 for(const key of ['code','name',...Object.keys(mapping)])if(!Object.keys(rows[0]).some(h=>h.toLowerCase()===column(key).toLowerCase()))throw Error(`Required column missing: ${column(key)}`);
 const seen=new Set();let inserted=0,skipped=0;
 for(let i=0;i<rows.length;i++){
  const row=rows[i];const c=code(get(row,'code')),name=required(get(row,'name'),`row ${i+2} title`);if(seen.has(c.toLowerCase()))throw Error(`Duplicate source identifier ${c}`);seen.add(c.toLowerCase());
  const raw=JSON.stringify(row);const old=await db.query('select id,raw_source from services where source=$1 and source_id=$2',[source,c]);
  if(old.length){if(JSON.stringify(old[0].raw_source)!==JSON.stringify(JSON.parse(raw))){const canonical=o=>JSON.stringify(Object.entries(o).sort(([a],[b])=>a.localeCompare(b)));if(canonical(old[0].raw_source)!==canonical(row))throw Error(`Changed source record ${c}; reconcile explicitly`);}skipped++;continue;}
  const team=get(row,'team')?(await resolve(db,'teams',get(row,'team'))).id:null;
  const lifecycle=oneOf(get(row,'lifecycle')||'proposed',['proposed','production','deprecated','retired'],'import lifecycle');const tier=oneOf(get(row,'tier')||'unknown',['critical','standard','low','unknown'],'import tier');
  // A dry run performs the same constraints, then rolls back its savepoint.
  const [s]=await db.query('insert into services(code,name,team_id,lifecycle,tier,runbook,repository,source,source_id,raw_source) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id',[c,name,team,lifecycle,tier,get(row,'runbook'),get(row,'repository'),source,c,raw]);
  await audit(db,actor,'import',s.id,{source,source_id:c,original:row});inserted++;
 }
 return {inserted,skipped,source,dry_run:Boolean(f['dry-run'])};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;const args=process.argv.slice(2);const json=args.includes('--json');
 try {db=await getDb();let result;
  if(args.includes('--dry-run')){
   if(args[0]!=='import')throw Error('--dry-run is supported only for import');
   // Wrap the existing transaction handle so import's transaction commits to a savepoint only.
   await db.exec('BEGIN');await db.exec('SAVEPOINT preview');
   const preview={...db,exec:async sql=>{if(sql==='BEGIN'||sql.startsWith('SET TRANSACTION'))return;if(sql==='COMMIT')return db.exec('RELEASE SAVEPOINT preview');if(sql==='ROLLBACK')return db.exec('ROLLBACK TO SAVEPOINT preview');return db.exec(sql);}};
   try{result=await run(preview,args);}finally{await db.exec('ROLLBACK');}
  }else result=await run(db,args);
  if(json)console.log(JSON.stringify(result,null,2));else if(Array.isArray(result)&&result.some(x=>'rows' in x)){for(const x of result)console.log(`\n${x.number}. ${x.question}\n${display(x.rows)}`);}else console.log(Array.isArray(result)?display(result):JSON.stringify(result,null,2));
 }catch(e){console.error(json?JSON.stringify({error:e.message}):`Error: ${e.message}`);process.exitCode=1;}finally{if(db)await db.close();}
}
