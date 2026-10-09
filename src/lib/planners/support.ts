export type StartupSupport = {
  name: string;
  description: string;
  label: string;
  url: string;
};

const site = "https://practicestartupservices.com";
const consulting: StartupSupport = {
  name: "PPS startup consulting",
  description: "Get help reviewing your startup budget, launch sequence, and the work ahead.",
  label: "Explore startup support",
  url: `${site}/services/practice-startup-consulting/`,
};
const laborGenie: StartupSupport = {
  name: "LaborGenie",
  description: "Bring staff onboarding, training, and compliance preparation into your launch plan. Claim your free LaborGenie license for up to 10 users through PPS. Regular price: $9.99 per user/month.",
  label: "Claim your free LaborGenie license",
  url: `${site}/resources/hipaa-training/`,
};
const billing: StartupSupport = {
  name: "PPS revenue cycle support",
  description: "Get help with billing workflows, claims follow-up, denials, and collections.",
  label: "Explore billing support",
  url: `${site}/services/revenue-cycle-management/`,
};

// Existing task IDs are persisted in visitor backups. Keep this mapping separate
// from the ordered task list so adding support never renumbers a saved plan.
const support: Record<string, StartupSupport> = {
  "task-6": consulting,
  "task-8": {
    name: "UnfairCPA",
    description: "Explore UnfairCPA as you organize your practice's financial tools and accounting workflow. Review tax and accounting decisions with your adviser.",
    label: "Explore UnfairCPA",
    url: "https://unfaircpa.com/",
  },
  "task-17": {
    name: "PPS credentialing & enrollment",
    description: "Let the PPS team help prepare applications, track payer requests, and follow up on enrollment.",
    label: "Explore credentialing support",
    url: `${site}/services/medical-credentialing/`,
  },
  "task-18": billing,
  "task-22": {
    name: "PPS technology & AI support",
    description: "Discuss EHR, billing, phone systems, and practical AI tools with the PPS team.",
    label: "Explore technology support",
    url: `${site}/services/technology-ai-implementation/`,
  },
  "task-24": laborGenie,
  "task-26": laborGenie,
  "task-27": laborGenie,
  "task-29": {
    name: "PPS practice websites",
    description: "Get help building a practice website that explains your services and makes it easy for patients to take the next step.",
    label: "Explore website services",
    url: `${site}/services/website-design/`,
  },
  "task-34": billing,
};

export function supportForTask(taskId: string): StartupSupport | undefined {
  return Object.hasOwn(support, taskId) ? support[taskId] : undefined;
}
