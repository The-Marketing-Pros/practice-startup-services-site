// HubSpot's successful booking message, constrained to our actual iframe.
// Never pass the message (which can contain contact details) to analytics.
const ORIGIN = 'https://meetings-na2.hubspot.com';
const SEEN_KEY = 'pss_bookings_seen_v1';
type Store = Pick<Storage, 'getItem' | 'setItem'>;
type Message = { origin: string; source: unknown; data: unknown };
export function createBookingReceiver(options: {
  frameWindow: () => unknown;
  onBooked: (eventId: string) => void;
  uuid: () => string;
  session?: Store;
}) {
  const seen = new Set<string>();
  let anonymousConfirmed = false;
  return (event: Message): boolean => {
    const frame = options.frameWindow();
    if (!frame || event.source !== frame || event.origin !== ORIGIN) return false;
    if (!event.data || typeof event.data !== 'object') return false;
    const data = event.data as Record<string, any>;
    if (data.meetingBookSucceeded !== true) return false;
    const booking = data.meetingsPayload?.bookingResponse;
    const start = booking?.event?.dateTime ?? booking?.postResponse?.timerange?.start ?? booking?.event?.dateString;
    const key = (typeof start === 'string' || typeof start === 'number') && String(start).length > 0
      ? `consultation:${String(start).slice(0, 100)}` : '';
    // Some HubSpot messages omit a booking identity. Count only the first such
    // confirmation per page; do not infer another appointment from a timeout.
    if (anonymousConfirmed) return false;
    if (key) {
      if (seen.has(key)) return false;
      let stored: string[] = [];
      try {
        const parsed: unknown = JSON.parse(options.session?.getItem(SEEN_KEY) || '[]');
        if (Array.isArray(parsed)) stored = parsed.filter((v): v is string => typeof v === 'string');
      } catch { /* memory still protects against repeated messages */ }
      if (stored.includes(key)) return false;
      seen.add(key);
      try { options.session?.setItem(SEEN_KEY, JSON.stringify([...stored.slice(-19), key])); } catch {}
    } else {
      // Also reject a payload-free repeat after an identified confirmation.
      if (seen.size) return false;
      anonymousConfirmed = true;
    }
    options.onBooked(`pss_booking_${options.uuid()}`);
    return true;
  };
}

/** Explicitly forward only UTMs. HubSpot’s embed also appends its parent-page URL. */
export function calendarUrl(base: string, attribution: Record<string, string>): string {
  const url = new URL(base);
  url.searchParams.set('embed', 'true');
  url.searchParams.set('Is there anything you can share to help us prepare for this meeting?', 'Consultation category: Start-up consulting & credentialing. Booked through Practice Startup Services.');
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id']) {
    const value = attribution[key];
    if (value) url.searchParams.set(key, value.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').slice(0, 200));
  }
  return url.href;
}
