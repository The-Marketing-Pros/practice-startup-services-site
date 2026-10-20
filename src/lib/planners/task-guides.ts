/** Practical planning aids, not universal legal prerequisites. Stable task IDs
 * keep the guides attached to existing saved progress. */
export type TaskGuide = { steps: string[]; complete: string; after?: string[] };
export const taskGuides: Record<string, TaskGuide> = {
  "task-1": {
    steps: ["Describe the patients and services you intend to serve.", "Write down your preferred hours, care setting, and personal income needs.", "Identify the decisions you still need help making."],
    complete: "You have a short practice brief that you can explain to a partner or adviser.",
  },
  "task-2": {
    steps: ["Compare patient demand, competitors, and potential referral sources.", "Evaluate access, parking, travel distance, and nearby services.", "Record the evidence behind your location choice and what still needs validation."],
    complete: "You can explain why the market fits your planned services, with sources and open questions.",
  },
  "task-5": {
    steps: ["Describe your services, patients, referral strategy, and launch milestones.", "Connect the plan to your budget and patient-volume assumptions.", "List risks, owners, and the decisions needed before committing funds."],
    complete: "Your written plan explains how the practice will attract patients, operate, and fund its launch.",
    after: ["task-1", "task-2"],
  },
  "task-6": {
    steps: ["Gather quotes for space, equipment, technology, staffing, and insurance.", "Estimate collectible revenue and the time between visits and payments.", "Check the lowest cash balance and choose a reserve for uncertainty."],
    complete: "You have a saved forecast with reviewed inputs and a plan for any funding gap.",
    after: ["task-1"],
  },
  "task-7": {
    steps: ["Separate practice startup costs from your household needs.", "List available funding, expected timing, and loan payments.", "Decide how much cash to keep in reserve and who will review the plan."],
    complete: "Your funding sources and timing support the forecast and your personal living costs.",
    after: ["task-6"],
  },
  "task-11": {
    steps: ["Confirm the entity structure and filings with your advisers.", "Keep entity, tax, banking, and provider records consistent.", "Set up bookkeeping and a place to retain formation and tax records."],
    complete: "The agreed registrations are documented and your practice banking and bookkeeping are ready.",
    after: ["task-9"],
  },
  "task-15": {
    steps: ["Gather licenses, coverage, education, work history, and requested references.", "Check that names, addresses, and identifiers match across documents.", "Assign someone to respond to missing-document requests and maintain profiles."],
    complete: "The applicable credentialing packet is complete and someone owns updates.",
  },
  "task-17": {
    steps: ["Create one record for each payer, provider, and location.", "Record submission dates, contacts, requests, contract status, and effective dates.", "Keep follow-up dates and supporting correspondence together."],
    complete: "Every intended payer has a documented status, next action, and responsible person; submitting is not approval.",
    after: ["task-14", "task-15", "task-16"],
  },
  "task-18": {
    steps: ["Confirm participation and effective dates for each provider and location.", "Share the confirmed payer details with the billing team.", "Check eligibility, claim routing, payment enrollment, and the test workflow."],
    complete: "Your billing team has verified the applicable payer setup and documented outstanding exceptions.",
    after: ["task-17", "task-22"],
  },
  "task-20": {
    steps: ["Compare total occupancy costs, permitted use, and buildout responsibilities.", "Review contingencies and the proposed agreement with your advisers.", "Align possession, installation, and opening dates with the launch budget."],
    complete: "The site and agreement have been reviewed, with costs and responsibilities recorded.",
    after: ["task-2", "task-6", "task-13"],
  },
  "task-21": {
    steps: ["Separate essential opening-day items from later purchases.", "Confirm lead times, installation, training, service, and warranty costs.", "Assign receiving and testing dates, and update the startup budget with quotes."],
    complete: "Essential equipment and supplies have owners, budgets, delivery dates, and acceptance checks.",
  },
  "task-22": {
    steps: ["Compare EHR, scheduling, billing, payments, phone, and fax workflows.", "Review implementation costs, contracts, support, and data access.", "Assign configuration and training owners, then schedule a workflow rehearsal."],
    complete: "Systems are selected with a documented implementation schedule and total cost.",
  },
  "task-26": {
    steps: ["List roles, duties, pay, and the month each person needs to start.", "Plan recruiting, payroll, benefits, and required employment paperwork with your advisers.", "Assign training, system access, and a first-week checklist for each role."],
    complete: "Each opening-day role has an owner, a budgeted start date, and an onboarding plan.",
    after: ["task-6"],
  },
  "task-28": {
    steps: ["Walk through scheduling, intake, consent, eligibility, payment, and the visit.", "Assign responsibility for results, referrals, messages, and records requests.", "Prepare patient instructions and escalation procedures for exceptions."],
    complete: "Your team can follow the patient workflow and knows who handles exceptions.",
    after: ["task-22"],
  },
  "task-29": {
    steps: ["Confirm the practice name, domain, services, contact details, and hours.", "Publish clear appointment instructions and an accurate opening timeline.", "Test contact and booking routes on a phone and desktop."],
    complete: "Patients can find accurate practice information and successfully request an appointment.",
  },
  "task-31": {
    steps: ["Use a fictional patient to rehearse the complete workflow.", "Test handoffs between the front desk, clinician, and billing team.", "Record failures, assign corrections, and repeat the affected steps."],
    complete: "The rehearsal works end to end and any remaining issues have owners and a resolution plan.",
    after: ["task-22", "task-28"],
  },
  "task-32": {
    steps: ["Review unresolved licensing, payer, staffing, systems, and facility questions.", "Check the funding plan against the latest costs and opening date.", "Document the opening decision and who owns each remaining action."],
    complete: "The responsible people have reviewed launch risks and documented the opening decision.",
    after: ["task-7", "task-12", "task-18", "task-31"],
  },
  "task-33": {
    steps: ["Compare actual visits, collections, costs, and cash with your forecast.", "Explain significant differences and update the coming months.", "Choose the next operational change and assign an owner."],
    complete: "A recurring review has an owner and produces recorded decisions.",
  },
};
