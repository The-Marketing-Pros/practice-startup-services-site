// PracticeStartupServices.com — site-level constants
// CRM scheduling URL is a placeholder — Andrew drops at Phase 7 (one outstanding blocker).

export const SITE = {
  name: "Practice Startup Services",
  domain: "practicestartupservices.com",
  url: "https://practicestartupservices.com",
  tagline: "The practice launch guide — and the team to make it real.",
  promise:
    "The complete platform for launching a private medical practice — free guides, expert services, and the tools to make it real.",
  // 03b Decision #7 — TMP CRM scheduling form. Token replaced when Andrew provides URL.
  scheduleUrl: "{{SCHEDULE_URL}}",
  metoliusToolsUrl: "https://mymetolius.com/tools",
  ppsInspiration: "https://physicianpracticespecialists.com",
  primaryCta: "Schedule a Consultation",
  secondaryCta: "Get the Startup Checklist",
};

/**
 * The Architect — AI companion configuration.
 *
 * The widget loads from the prompt-platform's `/embed/chat.js` route (PR #261).
 * Agent is configured in the CRM (see 06a-the-architect-system-prompt.md in the
 * campaign folder). The widget is *not visible* on the site until enabled === true
 * and all three values below are real (not template tokens).
 */
export const ARCHITECT = {
  enabled: false, // flip to true once appUrl + publicKey + turnstileSitekey are real
  appUrl: "{{PROMPT_PLATFORM_APP_URL}}", // e.g. https://crm.themarketingpros.com
  agentSlug: "the-architect-pss",
  publicKey: "{{ARCHITECT_PUBLIC_KEY}}",
  turnstileSitekey: "{{TURNSTILE_SITEKEY}}",
  accent: "#B68546", // bronze — matches PSS brand
  title: "Ask The Architect",
  greeting:
    "I'm the AI companion for this site — I know all 7 phases of the launch blueprint and the services that match each one. Ask me anything about starting a private medical practice and I'll point you to the right page, the right resource, or the right next move.",
};

export const NAV = [
  {
    label: "The Blueprint",
    href: "/journey/",
    children: [
      { label: "Phase 1 — Decide", href: "/journey/is-this-right-for-me/" },
      { label: "Phase 2 — Plan", href: "/journey/business-planning/" },
      { label: "Phase 3 — Form", href: "/journey/legal-entity-setup/" },
      { label: "Phase 4 — Credential", href: "/journey/credentialing-enrollment/" },
      { label: "Phase 5 — Build", href: "/journey/infrastructure-technology/" },
      { label: "Phase 6 — Launch", href: "/journey/launch-marketing/" },
      { label: "Phase 7 — Grow", href: "/journey/grow-optimize/" },
    ],
  },
  {
    label: "Services",
    href: "/services/",
    children: [
      { label: "Practice Startup Consulting", href: "/services/practice-startup-consulting/" },
      { label: "Medical Credentialing", href: "/services/medical-credentialing/" },
      { label: "Revenue Cycle Management", href: "/services/revenue-cycle-management/" },
      { label: "Medical Practice Websites", href: "/services/website-design/" },
      { label: "Technology + AI", href: "/services/technology-ai-implementation/" },
      { label: "Practice Infrastructure", href: "/services/practice-infrastructure/" },
    ],
  },
  {
    label: "By Specialty",
    href: "/specialty/",
    children: [
      { label: "Primary Care", href: "/specialty/primary-care/" },
      { label: "Family Medicine", href: "/specialty/family-medicine/" },
      { label: "Pediatrics", href: "/specialty/pediatrics/" },
      { label: "Orthopedics", href: "/specialty/orthopedics/" },
      { label: "Dermatology", href: "/specialty/dermatology/" },
      { label: "Cardiology", href: "/specialty/cardiology/" },
      { label: "Gastroenterology", href: "/specialty/gastroenterology/" },
      { label: "Neurology", href: "/specialty/neurology/" },
      { label: "Urology", href: "/specialty/urology/" },
      { label: "OB/GYN", href: "/specialty/obgyn/" },
      { label: "Anesthesiology", href: "/specialty/anesthesiology/" },
      { label: "Psychiatry", href: "/specialty/psychiatry/" },
      { label: "Behavioral Health", href: "/specialty/behavioral-health/" },
    ],
  },
  {
    label: "By State",
    href: "/states/",
    children: [
      { label: "Florida", href: "/states/florida/" },
      { label: "Texas", href: "/states/texas/" },
      { label: "California", href: "/states/california/" },
      { label: "New York", href: "/states/new-york/" },
      { label: "Pennsylvania", href: "/states/pennsylvania/" },
      { label: "Illinois", href: "/states/illinois/" },
      { label: "Ohio", href: "/states/ohio/" },
      { label: "Georgia", href: "/states/georgia/" },
      { label: "North Carolina", href: "/states/north-carolina/" },
      { label: "Arizona", href: "/states/arizona/" },
      { label: "Washington", href: "/states/washington/" },
      { label: "New Jersey", href: "/states/new-jersey/" },
      { label: "Virginia", href: "/states/virginia/" },
      { label: "Massachusetts", href: "/states/massachusetts/" },
      { label: "Tennessee", href: "/states/tennessee/" },
    ],
  },
  {
    label: "Free Resources",
    href: "/resources/",
    children: [
      { label: "Startup Checklist", href: "/resources/startup-checklist/" },
      { label: "Medicare Tools", href: "/resources/medicare-tools/" },
      { label: "Startup Cost Guide", href: "/resources/startup-costs/" },
      { label: "Articles", href: "/resources/articles/" },
      { label: "Launch Readiness Scan", href: "/scan/" },
    ],
  },
  {
    label: "Who We Help",
    href: "/who-we-help/",
    children: [
      { label: "Physicians (MD/DO)", href: "/who-we-help/physicians/" },
      { label: "Nurse Practitioners", href: "/who-we-help/nurse-practitioners/" },
      { label: "Physician Assistants", href: "/who-we-help/physician-assistants/" },
      { label: "Behavioral Health", href: "/who-we-help/behavioral-health/" },
      { label: "Specialty Practices", href: "/who-we-help/specialty/" },
    ],
  },
  { label: "About", href: "/about/", children: [] },
];
