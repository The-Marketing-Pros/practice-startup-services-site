import test from 'node:test';
import assert from 'node:assert/strict';
import {financeWorkbook} from '../src/lib/planners/downloads.ts';
import {newFinance,project} from '../src/lib/planners/finance.ts';
test('Excel formulas and cached results reconcile to cash model across delay and ramp cases',async()=>{
 for(const [lag,ramp] of [[0,1],[1,12],[6,24]]){
  const plan=newFinance();plan.opening='2026-12';plan.values.lag=lag;plan.values.ramp=ramp;plan.name='=HYPERLINK("https://example.invalid","unsafe")';
  const expected=project(plan);const w=await financeWorkbook(plan);const s=w.getWorksheet('Monthly forecast')!;const a=w.getWorksheet('Assumptions')!;
  assert.equal(a.getCell('B3').type,3); // String, never formula, even for formula-like names.
  for(const m of expected.months){const row=m.month+7;for(const [col,value] of [['E',m.earned],['F',m.collected],['L',m.netCash],['M',m.balance],['N',m.receivables]] as const){const cell=s.getCell(`${col}${row}`);assert.ok(cell.formula);assert.equal(cell.result,value);}}
  assert.match(s.getCell('F8').formula,/INDEX/);assert.equal(w.getWorksheet('Summary')!.getCell('B13').result,expected.fundingGap);
  const bytes=await w.xlsx.writeBuffer();assert.ok(bytes.byteLength>10000);
 }
});

test('checklist exports include relevant optional services without changing task IDs or progress',async()=>{
 const {checklistWorkbook}=await import('../src/lib/planners/downloads.ts');
 const {newChecklist,visibleTasks}=await import('../src/lib/planners/checklist.ts');
 const p=newChecklist();p.progress['task-8']={done:true,owner:'Founder',due:null,notes:'Compare advisers'};
 const before=structuredClone(p);const w=await checklistWorkbook(p);const s=w.getWorksheet('Startup checklist')!;
 const accountingRow=visibleTasks(p).findIndex(t=>t.id==='task-8')+8;
 assert.equal(s.getCell(`C${accountingRow}`).value,'Complete');
 assert.match(String(s.getCell(`H${accountingRow}`).value),/UnfairCPA/);
 assert.equal(s.getCell(`I${accountingRow}`).hyperlink,'https://unfaircpa.com/');
 assert.deepEqual(p,before);
 p.profile.payer='cash';p.profile.staff='no';
 const cash=await checklistWorkbook(p);const values=JSON.stringify(cash.getWorksheet('Startup checklist')!.getSheetValues());
 assert.doesNotMatch(values,/PPS credentialing & enrollment|PPS revenue cycle support/);
 assert.match(values,/LaborGenie/);
});
