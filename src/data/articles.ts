export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}
export interface Article {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  author: string;
  readMinutes: number;
  status: 'draft' | 'published';
  topics: string[];
  sections: ArticleSection[];
  action: { label: string; href: string; description: string };
  sources: { label: string; href: string }[];
}

export const articles: Article[] = [
  {
    slug: 'turn-your-startup-checklist-into-a-working-plan',
    title: 'Turn your startup checklist into a working plan.',
    description: 'Give tasks owners, track dependencies, and keep your next step visible as your launch takes shape.',
    publishedAt: '2026-10-08', author: 'PPS resource team', readMinutes: 3, status: 'published', topics: ['Launch planning'],
    sections: [
      { id:'start-with-your-model',heading:'Start with the practice you are actually opening.',paragraphs:[
        'A useful checklist reflects your practice model. A virtual practice and an office-based group will share some setup work, but their space, staffing, equipment, and daily workflows will differ. Begin by choosing your model and reviewing every suggested task. Add work that is missing and note why an item may not apply.',
        'Treat the target opening date as a planning input. It helps you see what needs attention; it does not confirm that a payer, landlord, vendor, or licensing body will be ready on that date.'
      ]},
      { id:'make-tasks-actionable',heading:'Give every task a clear finish line.',paragraphs:[
        '“Set up phones” leaves several decisions hidden. A more useful task describes the result: choose the number, configure call routing, record the greeting, and test an inbound call. Use notes to capture these steps without losing the larger launch view.',
        'Assign one person to move the task forward, even when several people contribute. An owner should know what evidence will show the task is complete and who needs to review it.'
      ],bullets:['Owner: who is responsible for the next action?','Target date: when should that action happen?','Dependency: which decision, document, or other task is needed first?','Completion evidence: a confirmation, tested workflow, signed document, or other result.']},
      { id:'review-and-share',heading:'Make the weekly review short and specific.',paragraphs:[
        'Review overdue work, blocked items, and the next actions due. If a date moves, check what else depends on it. A delayed equipment delivery might change training plans; a revised staffing plan may change your financial forecast.',
        'The online checklist saves on the device you use. Export an Excel workbook for editable work in Excel or Google Sheets, and use the PDF when you want a snapshot to share. A downloaded file is a separate copy, so agree with your team which version is the current plan. Keep a backup before clearing browser data.'
      ]},
      { id:'use-support',heading:'Ask for help at the point of uncertainty.',paragraphs:[
        'A checklist can make an unanswered question visible. It cannot make an entity decision, verify a payer approval, or test your office workflow for you. Bring the specific task, its dependency, and your target date to the person who can resolve it. The optional PPS and partner links in the checklist give you places to start; using a service is not a requirement to complete your plan.'
      ]}
    ],
    action:{label:'Build my startup checklist',href:'/resources/startup-checklist/',description:'Customize tasks, assign owners, set dates, and download your working plan.'},sources:[]
  },
  {
    slug:'build-a-practice-startup-budget-you-can-update',
    title:'Build a startup budget you can keep updating.',
    description:'Separate opening costs from monthly expenses and make the assumptions behind your forecast easy to revisit.',
    publishedAt:'2026-10-08',author:'PPS resource team',readMinutes:3,status:'published',topics:['Startup finances'],
    sections:[
      {id:'separate-the-costs',heading:'Separate the opening bill from the monthly bill.',paragraphs:[
        'A single startup total can hide when cash is needed. Start with separate lists for one-time setup costs and recurring operating expenses. The SBA uses this distinction in its startup-cost guidance. Then add when each payment is due, so the plan reflects timing as well as totals.',
        'For each line, record the source: a vendor quote, lease proposal, staffing plan, or your own estimate. Flag estimates clearly. You can replace them as better information becomes available without rebuilding the whole plan.'
      ]},
      {id:'record-assumptions',heading:'Keep the assumptions beside the numbers.',paragraphs:[
        'Your forecast should explain what you expect to happen. Record the planned clinical schedule, the number of providers, how quickly visits may build, and your estimate of collections. Avoid treating a listed charge as cash that will necessarily arrive in the bank.',
        'Review the start month for each expense. A system may begin charging before your first patient arrives. A new team member may need paid training before opening. Those differences belong in the plan, even if they are easy to miss in a simple annual total.'
      ],bullets:['Which expenses start before opening?','Which amounts are confirmed and which remain estimates?','What changes if the opening date moves?','What is included in each vendor quote, and what is billed separately?']},
      {id:'compare-scenarios',heading:'Change one assumption and look at the effect.',paragraphs:[
        'Create a base case, then explore a slower start. Try changing patient volume, the opening date, or collection timing. Label each version so you can compare what changed and why. These are planning scenarios, not predictions of a particular practice’s results.',
        'Look for the months when available cash falls lowest. That can help frame a conversation with your accountant or financing adviser about the assumptions, funding needs, and choices available to you. Keep personal living costs visible in your wider planning, even when they are separate from practice expenses.'
      ]},
      {id:'keep-it-current',heading:'Update the forecast when a decision becomes real.',paragraphs:[
        'Use the pro forma builder to explore the first 24 months, then download Excel if you want to continue working with the numbers. Replace estimates with actual quotes and expenses as the project progresses. The online model is a planning aid; an adviser can help assess financing, accounting, and tax decisions for your circumstances.'
      ]}
    ],action:{label:'Build my pro forma',href:'/resources/pro-forma/',description:'Explore startup costs, revenue assumptions, expenses, and collection timing.'},sources:[{label:'SBA: Plan your business — startup costs',href:'https://www.sba.gov/counseling/plan-your-business/'}]
  },
  {
    slug:'organize-credentialing-before-you-apply',
    title:'Organize credentialing before you apply.',
    description:'Build a document inventory and payer tracker that makes follow-up easier from the first application onward.',
    publishedAt:'2026-10-08',author:'PPS resource team',readMinutes:3,status:'published',topics:['Credentialing'],
    sections:[
      {id:'choose-the-path',heading:'Identify the enrollment path for each payer.',paragraphs:[
        'Start with the providers, practice locations, and payers you intend to work with. Ask each payer which application path and documentation fit your situation. Keep individual provider work separate from group or organization work in your tracker so one status does not stand in for another.',
        'For Medicare, CMS directs providers through NPI setup, an enrollment application through PECOS, an application fee where applicable, and follow-up with the relevant Medicare Administrative Contractor. CMS provides separate guidance for institutional providers and DMEPOS suppliers. Use the path that fits your provider type.'
      ]},
      {id:'document-inventory',heading:'Create a document inventory, then check the details.',paragraphs:[
        'Use the payer’s current requirements to build the inventory. Documents may include professional licenses, training history, insurance details, practice identifiers, and information about the organization. Do not assume that one checklist covers every payer or provider type.',
        'Track who holds each item, whether it is current, and whether names, locations, and identifiers agree across the application. Store sensitive documents in an appropriate secure system. Your public planning checklist can record the task and owner without containing the document itself.'
      ]},
      {id:'track-next-action',heading:'Track the next action, not just “submitted.”',paragraphs:[
        'A submission is a milestone. Keep the receipt or reference number and record the next action separately. If a payer asks for additional information, assign an owner and track the response so the request does not disappear into an inbox.',
        'Use a simple status log that distinguishes preparing, submitted, information requested, and approval confirmed. Keep the payer’s written confirmation with the record. Verify applicable effective dates, locations, provider associations, and billing arrangements with the payer before treating an enrollment as ready for use.'
      ],bullets:['Payer and application or provider type','Submission date and reference number','Current status and last contact','Requested information, owner, and next follow-up','Written decision and applicable effective date']},
      {id:'connect-launch-plan',heading:'Connect payer status to the launch plan.',paragraphs:[
        'Share the verified status with the people responsible for scheduling, billing, and financial planning. A change to one payer’s timeline can affect those teams differently. Update your launch checklist and financial assumptions together instead of relying on a single promised completion date.',
        'PPS can help prepare and follow up on credentialing and enrollment work. Payer decisions and processing times remain outside the practice’s direct control.'
      ]}
    ],action:{label:'Explore the credentialing stage',href:'/journey/credentialing-enrollment/',description:'Connect application preparation and follow-up to your wider practice launch.'},sources:[{label:'CMS: Become a Medicare provider or supplier',href:'https://www.cms.gov/medicare/enrollment-renewal/providers-suppliers'}]
  }
];
export const publishedArticles = articles.filter(article=>article.status==='published');
