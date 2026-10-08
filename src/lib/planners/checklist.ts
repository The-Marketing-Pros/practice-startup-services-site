export const stages = [
  "Decide",
  "Plan",
  "Form",
  "Credential",
  "Build",
  "Launch",
  "Grow",
];
export const states =
  "Alabama,Alaska,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,District of Columbia,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming".split(
    ",",
  );
export type Profile = {
  name: string;
  state: string;
  provider: string;
  setting: string;
  payer: string;
  opening: string;
  staff: string;
};
export type Task = {
  id: string;
  phase: number;
  title: string;
  detail: string;
  weeks: number;
  when?: "insurance" | "office" | "telehealth" | "staff" | "np-pa";
};
export type Progress = {
  done: boolean;
  owner: string;
  due: string | null;
  notes: string;
};
export type Checklist = {
  version: 1;
  kind: "checklist";
  profile: Profile;
  progress: Record<string, Progress>;
  custom: Task[];
};
const rows: Array<[number, string, string, number, Task["when"]?]> = [
  [
    0,
    "Define the practice you want to build",
    "Identify your patients, services, location, working hours, and goals.",
    32,
  ],
  [
    0,
    "Research local demand and referral sources",
    "Review your market, competing services, patient needs, and referral relationships.",
    30,
  ],
  [
    0,
    "Review your current employment obligations",
    "Have counsel review notice periods, restrictive covenants, and any patient transition obligations.",
    30,
  ],
  [
    0,
    "Choose your care and payment model",
    "Decide on in-person or virtual care and insurance, cash-pay, or a hybrid approach.",
    28,
  ],
  [
    1,
    "Write a focused business plan",
    "Document services, positioning, staffing, risks, and your first-year operating plan.",
    28,
  ],
  [
    1,
    "Build your startup budget and cash forecast",
    "Use the pro forma builder. Replace sample inputs with quotes and expected net collections.",
    26,
  ],
  [
    1,
    "Plan funding and your personal runway",
    "Include startup purchases, collection delays, owner compensation, and a cash reserve.",
    26,
  ],
  [
    1,
    "Choose accounting and legal advisers",
    "Confirm experience with healthcare practices and the rules in your state.",
    26,
  ],
  [
    2,
    "Verify ownership and professional entity requirements",
    "Ask your state licensing board and healthcare counsel which ownership and entity structures apply.",
    24,
  ],
  [
    2,
    "Confirm your scope of practice and required agreements",
    "Verify current supervision, collaboration, prescribing, and ownership requirements with your state board.",
    24,
    "np-pa",
  ],
  [
    2,
    "Form the entity and establish tax accounts",
    "Coordinate registration, EIN, banking, bookkeeping, and applicable tax registrations with your advisers.",
    22,
  ],
  [
    2,
    "Confirm professional licenses and insurance",
    "Check licensure, malpractice coverage, business insurance, and prescribing registrations if applicable.",
    22,
  ],
  [
    2,
    "Verify local permits and facility requirements",
    "Confirm zoning, occupancy, accessibility, and any service-specific permits before committing to a space.",
    22,
    "office",
  ],
  [
    3,
    "Create or update provider identifiers",
    "Confirm individual NPI and organization NPI applicability; keep names, tax IDs, and locations consistent.",
    22,
  ],
  [
    3,
    "Prepare credentialing documents and CAQH",
    "Gather licenses, education, coverage, work history, and supporting documents. Keep applicable profiles current.",
    22,
    "insurance",
  ],
  [
    3,
    "Select payers and verify network opportunities",
    "Confirm the networks you want, their application requirements, and whether they are accepting providers.",
    22,
    "insurance",
  ],
  [
    3,
    "Submit enrollment and track every payer",
    "Track requests, missing documents, contracts, and effective dates. Timelines differ by payer and application.",
    20,
    "insurance",
  ],
  [
    3,
    "Confirm billing readiness before treating in network",
    "Verify participation, effective dates, locations, and billing configuration; do not assume submission equals approval.",
    2,
    "insurance",
  ],
  [
    3,
    "Set patient pricing and payment policies",
    "Review financial policies, good faith estimate obligations, and any Medicare opt-out or private-contracting implications with counsel.",
    12,
  ],
  [
    4,
    "Select your space and review the lease",
    "Validate total occupancy costs, buildout, permitted use, and contingency terms with your advisers.",
    20,
    "office",
  ],
  [
    4,
    "Order equipment and supplies",
    "Plan procurement, installation, training, and service-specific safety requirements.",
    12,
    "office",
  ],
  [
    4,
    "Choose your EHR, billing, and phone systems",
    "Compare total cost, interoperability, support, contracts, and how the systems fit your workflow.",
    14,
  ],
  [
    4,
    "Design the telehealth workflow",
    "Verify licensure where patients are located, consent requirements, emergency procedures, and platform suitability.",
    12,
    "telehealth",
  ],
  [
    4,
    "Assess privacy and security risks",
    "Determine applicable HIPAA obligations, perform a risk analysis, and establish safeguards and response procedures.",
    12,
  ],
  [
    4,
    "Review vendors and business associate agreements",
    "Identify vendors handling protected health information and execute appropriate agreements where required.",
    10,
  ],
  [
    4,
    "Build a staffing and onboarding plan",
    "Confirm roles, compensation, employment requirements, access permissions, and documented training.",
    10,
    "staff",
  ],
  [
    4,
    "Complete role-appropriate HIPAA training",
    "Document training and policies. A course certificate alone does not establish practice compliance.",
    4,
  ],
  [
    4,
    "Create patient and clinical workflows",
    "Prepare intake, consent, scheduling, clinical documentation, referrals, records retention, and escalation procedures.",
    6,
  ],
  [
    5,
    "Publish your website and contact information",
    "Make services, credentials, locations, hours, booking, and patient instructions easy to find.",
    6,
  ],
  [
    5,
    "Build referral relationships and a launch plan",
    "Introduce the practice to appropriate local referral partners and plan outreach.",
    6,
  ],
  [
    5,
    "Test a complete patient journey",
    "Rehearse booking, eligibility, intake, visit, documentation, payment, and claim submission as applicable.",
    2,
  ],
  [
    5,
    "Run an opening-readiness review",
    "Resolve outstanding licenses, payer status, technology, staffing, safety, and facility issues before opening.",
    1,
  ],
  [
    6,
    "Review weekly cash and operational metrics",
    "Compare visits, net collections, expenses, and cash runway against your plan.",
    -2,
  ],
  [
    6,
    "Review claims, denials, and accounts receivable",
    "Assign follow-up and track collection performance by payer.",
    -2,
    "insurance",
  ],
  [
    6,
    "Collect patient feedback and improve workflows",
    "Review access, patient experience, capacity, and follow-up processes.",
    -4,
  ],
  [
    6,
    "Maintain renewals, training, and credentialing",
    "Create recurring reminders for applicable renewals, attestations, training, and policy reviews.",
    -4,
  ],
];
export const tasks: Task[] = rows.map(
  ([phase, title, detail, weeks, when], i) => ({
    id: `task-${i + 1}`,
    phase,
    title,
    detail,
    weeks,
    when,
  }),
);
export function newChecklist(): Checklist {
  return {
    version: 1,
    kind: "checklist",
    profile: {
      name: "",
      state: "",
      provider: "physician",
      setting: "office",
      payer: "insurance",
      opening: "",
      staff: "yes",
    },
    progress: {},
    custom: [],
  };
}
export function visibleTasks(plan: Checklist): Task[] {
  const p = plan.profile;
  return [
    ...tasks.filter(
      (t) =>
        !t.when ||
        {
          insurance: p.payer !== "cash",
          office: p.setting !== "telehealth",
          telehealth: p.setting !== "office",
          staff: p.staff === "yes",
          "np-pa": ["np", "pa"].includes(p.provider),
        }[t.when],
    ),
    ...plan.custom,
  ].sort((a, b) => a.phase - b.phase);
}
export function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= "2000-01-01" &&
    value <= "2100-12-31" &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function suggestedDate(opening: string, weeks: number): string {
  if (!validDate(opening)) return "";
  const d = new Date(`${opening}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - weeks * 7);
  return d.toISOString().slice(0, 10);
}
export function taskProgress(plan: Checklist, t: Task) {
  const saved = plan.progress[t.id] || {
    done: false,
    owner: "",
    due: null,
    notes: "",
  };
  return {
    ...saved,
    due: saved.due ?? suggestedDate(plan.profile.opening, t.weeks),
  };
}
export function parseChecklist(raw: unknown): Checklist {
  const x = raw as Checklist;
  const text = (v: unknown, max: number) =>
    typeof v === "string" && v.length <= max;
  if (
    !x ||
    x.kind !== "checklist" ||
    x.version !== 1 ||
    !x.profile ||
    !Array.isArray(x.custom) ||
    x.custom.length > 100 ||
    !x.progress ||
    typeof x.progress !== "object" ||
    Array.isArray(x.progress)
  )
    throw Error("This is not a supported checklist backup.");
  const p = x.profile;
  if (
    !text(p.name, 100) ||
    !(p.state === "" || states.includes(p.state)) ||
    !["physician", "np", "pa", "therapist", "other"].includes(p.provider) ||
    !["office", "telehealth", "hybrid"].includes(p.setting) ||
    !["insurance", "cash", "hybrid"].includes(p.payer) ||
    !["yes", "no"].includes(p.staff) ||
    !(p.opening === "" || validDate(p.opening))
  )
    throw Error("The checklist profile is invalid.");
  const custom = x.custom.map((t) => {
    if (
      !t ||
      !/^custom-[a-zA-Z0-9-]+$/.test(t.id) ||
      !text(t.title, 160) ||
      !t.title.trim() ||
      !Number.isInteger(t.phase) ||
      t.phase < 0 ||
      t.phase > 6
    )
      throw Error("A custom task is invalid.");
    return {
      id: t.id,
      phase: t.phase,
      title: t.title,
      detail: "Your custom task.",
      weeks: 0,
    };
  });
  if (new Set(custom.map((t) => t.id)).size !== custom.length)
    throw Error("The backup contains duplicate tasks.");
  const progress: Record<string, Progress> = {};
  const allowed = new Set([...tasks, ...custom].map((t) => t.id));
  for (const [id, v] of Object.entries(x.progress)) {
    if (!allowed.has(id)) continue;
    if (
      !v ||
      typeof v.done !== "boolean" ||
      !text(v.owner, 100) ||
      !text(v.notes, 2000) ||
      !(v.due === null || v.due === "" || validDate(v.due))
    )
      throw Error("Task progress is invalid.");
    progress[id] = { done: v.done, owner: v.owner, due: v.due, notes: v.notes };
  }
  return {
    version: 1,
    kind: "checklist",
    profile: {
      name: p.name,
      state: p.state,
      provider: p.provider,
      setting: p.setting,
      payer: p.payer,
      opening: p.opening,
      staff: p.staff,
    },
    custom,
    progress,
  };
}
