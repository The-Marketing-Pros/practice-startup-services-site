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
