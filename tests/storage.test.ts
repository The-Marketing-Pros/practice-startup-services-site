import test from 'node:test';
import assert from 'node:assert/strict';

// Independent module instances model tabs sharing storage and an origin lock.
test('stale tabs cannot overwrite a newer plan, including queued writes and resets', async () => {
  const values = new Map<string,string>();
  const messages = new Map<string,{textContent:string}>();
  let activeTab = 'a';
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis,'document');
  let queue = Promise.resolve();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)}});
  Object.defineProperty(globalThis,'document',{configurable:true,value:{getElementById:()=>{if(!messages.has(activeTab)) messages.set(activeTab,{textContent:''});return messages.get(activeTab);}}});
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:(_key:string,fn:()=>void)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;}}}});
  try {
    const a = await import(new URL('../src/lib/planners/browser.ts?tab=a', import.meta.url).href) as typeof import('../src/lib/planners/browser.ts');
    const b = await import(new URL('../src/lib/planners/browser.ts?tab=b', import.meta.url).href) as typeof import('../src/lib/planners/browser.ts');
    for(const key of ['pps-startup-checklist-v1','pps-startup-proforma-v1']) {
      a.restore(key,(v:unknown)=>v); b.restore(key,(v:unknown)=>v);
      await Promise.all([a.store(key,{owner:'A'}),b.store(key,{owner:'B'})]);
      assert.deepEqual(JSON.parse(values.get(key)!),{owner:'A'});
      assert.match(messages.get('a')!.textContent,/Another tab/);
      await b.store(key,{reset:true});
      assert.deepEqual(JSON.parse(values.get(key)!),{owner:'A'});
      const update={owner:'A2'};
      const saving=a.store(key,update);update.owner='not yet saved';await saving;
      assert.deepEqual(JSON.parse(values.get(key)!),{owner:'A2'});
      b.restore(key,(v:unknown)=>v); await b.store(key,{owner:'B after reload'});
      assert.deepEqual(JSON.parse(values.get(key)!),{owner:'B after reload'});
      values.delete(key);await b.store(key,{owner:'stale after clear'});
      assert.equal(values.has(key),false);
    }
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
    await a.store('unsupported',{value:1});
    assert.equal(values.has('unsupported'),false);
    assert.match(messages.get('a')!.textContent,/saving is unavailable/);
  } finally {
    for(const [key,descriptor] of [['navigator',originalNavigator],['localStorage',originalStorage],['document',originalDocument]] as const) {
      if(descriptor) Object.defineProperty(globalThis,key,descriptor); else Reflect.deleteProperty(globalThis,key);
    }
  }
});
