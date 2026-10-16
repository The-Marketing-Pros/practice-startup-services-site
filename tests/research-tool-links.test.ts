import test from 'node:test';
import assert from 'node:assert/strict';
import { researchToolLinks } from '../src/lib/research/tool-links.ts';
test('tool links preserve practice context, correct the state and exclude private submission fields', () => {
 const links = researchToolLinks({zip:'32225',state:'New York',specialty:'family',provider:'physician',setting:'office',model:'solo',payer:'insurance',mix:'medicare',stage:'planning',email:'private@example.com',token:'secret',requestId:'private'});
 for (const link of Object.values(links)) {
   const url = new URL(link, 'https://practicestartupservices.com');
   assert.equal(url.searchParams.get('state'),'Florida');
   assert.equal(url.searchParams.get('zip'),'32225');
   assert.equal(url.searchParams.get('specialty'),'family');
   assert.equal(url.searchParams.get('mix'),'medicare');
   assert.ok(!link.includes('private')); assert.ok(!link.includes('secret'));
 }
});
test('cash-pay handoffs do not carry stale insurance mix', () => {
 assert.equal(new URL(researchToolLinks({payer:'cash',mix:'medicare'}).proforma,'https://example.com').searchParams.has('mix'),false);
});
