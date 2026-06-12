// Testimonials — INTEGRITY-GATED.
// No real client testimonials exist in this repo yet, so this array ships with
// a single placeholder entry that is hard-gated out of every build by
// `status: "placeholder"`. The Testimonials component renders ONLY entries
// with status "published". Never flip an entry to "published" without a real,
// verbatim client quote and written permission to use the attribution.
//
// TODO(operator): replace the placeholder with real testimonials (quote,
// attribution, permission on file), set status: "published".

export interface Testimonial {
  quote: string;
  attribution: string; // e.g. "Dr. — specialty, state" per permission granted
  context?: string; // e.g. "Launched a 2-provider family medicine practice"
  status: "placeholder" | "published";
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "[Testimonial pending operator input — do not publish. Replace with a real, verbatim client quote.]",
    attribution: "[Client name — pending operator input]",
    context: "[Practice type / launch context — pending operator input]",
    status: "placeholder",
  },
];

export const publishedTestimonials = testimonials.filter((t) => t.status === "published");
