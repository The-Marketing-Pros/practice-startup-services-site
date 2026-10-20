import { test } from "node:test";
import assert from "node:assert/strict";
import { collectHandoff, CHECKLIST_KEY, FINANCE_KEY, SOURCE_KEY, parseHandoff } from "../src/lib/planners/handoff.ts";
import { newChecklist } from "../src/lib/planners/checklist.ts";
import { newFinance } from "../src/lib/planners/finance.ts";
function memory(initial: Record<string,string> = {}) {
  const values = new Map(Object.entries(initial));
  return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)};
}
test("hands over current unsaved inputs and the other complete saved plan without changing either",()=>{
 const checklist=newChecklist();checklist.progress["task-1"]={done:true,owner:"Dr. A",due:"2027-01-02",notes:"Keep this useful detail"};
 const saved=newFinance(),current=newFinance(); current.values.reserve=12345.67;current.values.netPerVisit=120.49;
 const store=memory({[CHECKLIST_KEY]:JSON.stringify(checklist),[FINANCE_KEY]:JSON.stringify(saved)});
 const plan=collectHandoff(store,current);
 assert.equal(plan.finance?.values.reserve,12345.67);assert.deepEqual(plan.checklist,checklist);
 assert.equal(store.getItem(FINANCE_KEY),JSON.stringify(saved));assert.equal(store.getItem(CHECKLIST_KEY),JSON.stringify(checklist));
 assert.equal(collectHandoff(store,current).sourceId,plan.sourceId);
 assert.equal(store.getItem(SOURCE_KEY),plan.sourceId);
});
test("invalid or corrupt other plan is never silently omitted",()=>{
 const store=memory({[CHECKLIST_KEY]:"not json"});
 assert.throws(()=>collectHandoff(store,newFinance()));
 const invalid=newFinance();invalid.values.reserve=-1;
 assert.throws(()=>collectHandoff(memory(),invalid));
 assert.throws(()=>collectHandoff(memory()));
});
test("version and identity fences reject unrelated files",()=>{
 const valid=collectHandoff(memory(),newChecklist());
 assert.throws(()=>parseHandoff({...valid,version:2}));
 assert.throws(()=>parseHandoff({...valid,sourceId:"not-an-id"}));
});
