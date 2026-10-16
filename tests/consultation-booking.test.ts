import test from 'node:test';
import assert from 'node:assert/strict';
import { createBookingReceiver, calendarUrl } from '../src/lib/consultation-booking.ts';
import { trackConsultationBooked } from '../src/lib/measure.ts';
const origin = 'https://meetings-na2.hubspot.com';
const success = (start?: string) => ({ meetingBookSucceeded: true, meetingsPayload: { bookingResponse: { event: { dateTime: start }, postResponse: { contact: { email: 'private@example.test' } } } } });
const store = () => { const data = new Map<string,string>(); return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string,v: string) => { data.set(k,v); } }; };
test('only an actual success from the exact embedded HubSpot frame is accepted', () => {
 const frame = {}, received: string[] = [];
 const receive = createBookingReceiver({ frameWindow: () => frame, uuid: () => '1', onBooked: id => received.push(id) });
 for (const event of [
  { origin: 'https://meetings-na2.hubspot.com.evil.test', source: frame, data: success() },
  { origin, source: {}, data: success() },
  { origin, source: frame, data: { meetingBookSucceeded: false } },
  { origin, source: frame, data: { meetingBookSucceeded: 'true' } },
  { origin, source: frame, data: { type: 'resize', height: 900 } },
 ]) assert.equal(receive(event), false);
 assert.equal(receive({ origin, source: frame, data: success('2026-11-10T12:00:00Z') }), true);
 assert.deepEqual(received, ['pss_booking_1']);
});
test('duplicates are suppressed across callbacks and reloads, while a new identified booking counts', () => {
 const frame = {}, session = store(); let count = 0;
 const make = () => createBookingReceiver({ frameWindow: () => frame, session, uuid: () => String(count), onBooked: () => { count++; } });
 const a = make(), message = { origin, source: frame, data: success('2026-11-10T12:00:00Z') };
 assert.equal(a(message), true); assert.equal(a(message), false); assert.equal(make()(message), false);
 assert.equal(a({ ...message, data: success('2026-11-11T12:00:00Z') }), true);
 assert.equal(a({ ...message, data: success() }), false);
 assert.equal(count, 2);
});
test('anonymous confirmations count once and storage denial does not break deduplication', () => {
 const frame = {}; let count = 0;
 const receive = createBookingReceiver({ frameWindow: () => frame, uuid: () => '1', onBooked: () => { count++; }, session: { getItem() { throw Error(); }, setItem() { throw Error(); } } });
 assert.equal(receive({ origin, source: frame, data: success() }), true);
 assert.equal(receive({ origin, source: frame, data: success() }), false);
 assert.equal(receive({ origin, source: frame, data: success('2026-11-10') }), false);
 assert.equal(count,1);
});
test('a detached frame cannot report success', () => {
 assert.equal(createBookingReceiver({ frameWindow: () => null, uuid: () => '1', onBooked: () => assert.fail() })({origin,source:null,data:success()}),false);
});
test('calendar preserves UTMs without leaking contact or planner fields', () => {
 const url = new URL(calendarUrl('https://meetings-na2.hubspot.com/aeriksen/consultation-round-robin', { utm_source:'chatgpt', utm_campaign:'pss', email:'private@example.test', notes:'secret', oppref:'not-forwarded' }));
 assert.equal(url.searchParams.get('embed'),'true'); assert.equal(url.searchParams.get('utm_source'),'chatgpt');
 for(const key of ['email','notes','oppref']) assert.equal(url.searchParams.has(key),false);
});
test('booking emits appointment, not inquiry; provider failures are isolated', () => {
 const calls: unknown[][] = [];
 trackConsultationBooked('pss_booking_123', { gtag() { throw Error('blocked'); }, fbq() { throw Error('blocked'); }, oaiq: (...args) => calls.push(args) });
 assert.deepEqual(calls, [['measure','appointment_scheduled',{type:'customer_action'},{event_id:'pss_booking_123'}]]);
});
