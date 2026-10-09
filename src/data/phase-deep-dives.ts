// Phase deep-dive content — long-form editorial that earns the search traffic
// and the trust. Lives separately from phases.ts to keep that file lean.
// Render with PhaseDeepDive.astro on each /journey/[slug] page.

import type { PhaseId } from "./phases";

export interface DeepDiveSection {
  heading: string;
  body: string; // markdown-light: paragraphs separated by blank lines
  pullQuote?: string; // optional editorial pull quote to break visual rhythm
  numericCallout?: { label: string; value: string; sub?: string }; // optional inline stat
  // Optional horizontal comparison grid — breaks vertical prose monotony with a horizontal scan unit
  comparisonGrid?: {
    columnLabel: string; // e.g. "Model"
    rows: Array<{ name: string; lead: string; detail: string }>;
  };
}

export interface PhaseDeepDive {
  intro: string;
  sections: DeepDiveSection[];
  faq?: Array<{ q: string; a: string }>;
}

export const deepDives: Partial<Record<PhaseId, PhaseDeepDive>> = {
  "01": {
    "intro": "Make the decision concrete before turning it into a launch date.",
    "sections": [
      {
        "heading": "Define the practice you want to run.",
        "body": "Describe your intended patients, services, workweek, and role in the business. Include the administrative responsibilities you want to own and those you expect to delegate. A short written description makes it easier to compare practice models and discuss them with potential partners."
      },
      {
        "heading": "Separate an assumption from an answer.",
        "body": "List the questions that could change your decision: local demand, referral relationships, startup costs, staffing needs, and the way patients would pay. Assign a next step to each question. A conversation, quote, or small piece of research is more useful than treating an unknown as a certainty."
      },
      {
        "heading": "Review your current commitments.",
        "body": "Bring employment agreements, ownership questions, and proposed arrangements to qualified advisers before making commitments. Contract terms and professional requirements need review in the context of your state and circumstances. Use your checklist to track that review without storing sensitive documents in it."
      }
    ],
    "faq": [
      {
        "q": "Do I need to have every answer before I start planning?",
        "a": "No. Start with a list of assumptions and unanswered questions. Planning is how you make those uncertainties visible and decide what to investigate next."
      },
      {
        "q": "What should I bring to a startup conversation?",
        "a": "Bring your intended services, practice model, location, preferred timing, and the decisions you are still weighing. An early budget or checklist can help make the discussion specific."
      }
    ]
  },
  "02": {
    "intro": "A working financial plan becomes more useful as you replace estimates with evidence.",
    "sections": [
      {
        "heading": "Organize the timing of costs.",
        "body": "Separate one-time opening costs from recurring expenses. Record when each expense begins and whether the amount is a quote or an estimate. Include the preparation period before you see patients, as well as the months after opening."
      },
      {
        "heading": "Use scenarios to expose assumptions.",
        "body": "Compare your expected launch with a slower opening or a lower initial volume. Look at how those changes affect monthly cash flow. The purpose is to identify which assumptions deserve more attention, not to make a forecast look certain."
      },
      {
        "heading": "Keep the operating plan connected.",
        "body": "A change in staffing, space, systems, or payer timing can change the forecast. Update the budget when one of those decisions changes. Review financing, tax, and accounting questions with the relevant professional advisers."
      }
    ],
    "faq": [
      {
        "q": "Can I edit the forecast after downloading it?",
        "a": "Yes. The pro forma builder offers an Excel workbook and a PDF snapshot. Keep track of which version you are using; downloads are separate from the plan saved in your browser."
      },
      {
        "q": "Does the model tell me whether a lender will approve financing?",
        "a": "No. It is a planning tool. Lenders and advisers will assess your circumstances, documentation, assumptions, and their own requirements."
      }
    ]
  },
  "03": {
    "intro": "Treat business setup as coordinated work with your advisers, not a single form to file.",
    "sections": [
      {
        "heading": "Clarify who will own and operate the practice.",
        "body": "Write down the proposed owners, professional roles, services, and locations. Ask your healthcare attorney how the applicable professional and ownership requirements affect that plan. Ask your accountant about tax and reporting considerations before choosing a structure."
      },
      {
        "heading": "Keep a consistent set of business details.",
        "body": "As the setup is finalized, keep the legal name, addresses, identifiers, ownership information, and authorized contacts consistent across records. Assign someone to coordinate corrections when a detail changes. Payer applications, banking, and contracts may depend on these details."
      },
      {
        "heading": "Track the decisions and the remaining work.",
        "body": "Keep a list of documents to review, decisions to make, and registrations to confirm. Record the responsible adviser and next action. Store signed agreements and sensitive records securely rather than pasting them into the public checklist."
      }
    ],
    "faq": [
      {
        "q": "Can this guide tell me which entity to choose?",
        "a": "No. The appropriate structure depends on professional, ownership, tax, and state-specific considerations. Use the guide to organize your questions for qualified advisers."
      },
      {
        "q": "What can I do while that review is underway?",
        "a": "Develop your operating plan, collect quotes, list required documents, and identify tasks that depend on finalized business details. Confirm with your advisers before making commitments."
      }
    ]
  },
  "04": {
    "intro": "Keep each application visible from preparation through the payer’s written decision.",
    "sections": [
      {
        "heading": "Distinguish the workstreams.",
        "body": "Credential review, payer contracting, enrollment, and billing setup may involve different steps and contacts. Ask each payer what applies to the provider, group, location, and services involved. Record the next action for each workstream rather than assigning one overall status too early."
      },
      {
        "heading": "Use a complete follow-up record.",
        "body": "Track the submission reference, last contact, requested information, responsible person, and next follow-up. Keep written decisions with the relevant provider and location record. Confirm applicable effective dates and billing arrangements with the payer before using a status in scheduling or revenue assumptions."
      },
      {
        "heading": "Keep your opening plan flexible.",
        "body": "Payer processing times vary. Build the launch plan around verified requirements and status updates, and revisit the forecast when something changes. PPS can help organize and follow up on the work, while the payer retains control over its decision."
      }
    ],
    "faq": [
      {
        "q": "Does sending an application mean I am approved?",
        "a": "No. Track the submission and follow-up separately from a confirmed decision. Verify the applicable effective date, provider associations, locations, and billing arrangements with the payer."
      },
      {
        "q": "Where should I start for Medicare?",
        "a": "Use the current CMS provider enrollment guide and the instructions that apply to your provider type. It identifies the enrollment steps and directs you to the relevant Medicare Administrative Contractor."
      }
    ]
  },
  "05": {
    "intro": "Choose technology around the work your people need to do, then test the full workflow.",
    "sections": [
      {
        "heading": "Start with a patient journey.",
        "body": "Walk through an inquiry, appointment, visit, payment, and follow-up. Identify where information moves and who takes the next action. Use that workflow in vendor demonstrations so your team sees the tasks it will actually perform."
      },
      {
        "heading": "Give implementation an owner.",
        "body": "List setup, data migration, integration, access, training, and support responsibilities. Ask what the vendor includes, what your team must supply, and how issues are escalated. Test handoffs between systems using appropriate test data before opening."
      },
      {
        "heading": "Use AI with a defined job and human review.",
        "body": "AI can assist with organizing tasks and preparing drafts. Decide what information a tool may use, who reviews the output, and which actions need approval. Evaluate privacy and security requirements before introducing practice or patient data. Your relationship with PPS is with people who remain responsible for helping you move the work forward."
      }
    ],
    "faq": [
      {
        "q": "Should I select an EHR before mapping the workflow?",
        "a": "Write down the core workflow and requirements first. That gives you a consistent way to assess demonstrations, implementation needs, and ongoing support."
      },
      {
        "q": "Where does staff onboarding fit?",
        "a": "Plan onboarding alongside system setup. Include role-specific access, training, policies, and practice workflows, then verify that people can perform the tasks they will own."
      }
    ]
  },
  "06": {
    "intro": "An opening is a coordinated operating event as well as a marketing milestone.",
    "sections": [
      {
        "heading": "Make the first contact easy.",
        "body": "Explain your services, location, hours, and how to request an appointment. Give each contact channel an owner. Check the site on a phone and test the path from an inquiry to a confirmed appointment using a rehearsal workflow."
      },
      {
        "heading": "Keep public information accurate.",
        "body": "Review names, addresses, phone numbers, and service descriptions across your website and listings. Publish insurance participation only after the relevant status is confirmed. Keep the people answering inquiries informed when a detail changes."
      },
      {
        "heading": "Run a first-week rehearsal.",
        "body": "Walk the team through scheduling, arrival, visit handoffs, payment questions, and follow-up. Record what breaks or remains unclear. Resolve the most consequential gaps and agree on how the team will escalate issues during the opening period."
      }
    ],
    "faq": [
      {
        "q": "What should be ready before we promote appointments?",
        "a": "Confirm the services offered, scheduling capacity, inquiry response process, and information patients need. Rehearse the workflow so the team can deliver what the marketing describes."
      },
      {
        "q": "How do we know what to improve after launch?",
        "a": "Review inquiry sources, scheduling problems, patient feedback, and team observations. Choose a small number of changes and check whether they improve the experience."
      }
    ]
  },
  "07": {
    "intro": "Use a regular operating review to decide what needs attention before expanding.",
    "sections": [
      {
        "heading": "Compare the plan with actual activity.",
        "body": "Look at patient access, clinical capacity, revenue cycle, expenses, and team workload together. Track definitions consistently so one month can be compared with the next. Investigate the reasons behind a change before choosing a response."
      },
      {
        "heading": "Choose a small improvement you can follow through.",
        "body": "Give each improvement an owner and a way to assess the result. Examples include a clearer phone handoff, a missing-information check before billing, or a better onboarding routine. Keep the action list short enough that the team can complete it."
      },
      {
        "heading": "Keep recurring work in view.",
        "body": "Maintain a calendar for training, renewals, vendor reviews, and enrollment maintenance. Assign responsibility for checking the current requirements that apply to your practice. Growth planning should account for this ongoing work, not replace it."
      }
    ],
    "faq": [
      {
        "q": "When should we add a provider or service?",
        "a": "Assess demand, staffing, workflow capacity, financial assumptions, and any enrollment or other requirements with your advisers. The right timing depends on the practice’s circumstances."
      },
      {
        "q": "Can the startup tools still help after opening?",
        "a": "Yes. Update the financial assumptions, use the checklist for remaining work, and create new tasks for ongoing projects. Keep backups and clearly label exported versions."
      }
    ]
  }
};

export function getDeepDive(id: PhaseId): PhaseDeepDive | null {
  return deepDives[id] ?? null;
}
