// State landing pages — 10 priority states from Phase 0-2 SEO baseline.
// Per-state credentialing timing, common watchouts, payer landscape notes.
// Goal: rank for "[specialty] practice startup [state]" and adjacent queries.

export interface StateInfo {
  slug: string;
  abbr: string; // 2-letter code (postal)
  name: string; // full state name
  major: string[]; // major metros
  medicaidName: string; // state Medicaid program name
  medicaidTimingDays: string; // typical enrollment timing
  npAuthority: "full" | "reduced" | "restricted"; // NP independent practice authority
  paAuthorityNote: string; // brief PA practice rules note
  payerLandscapeNote: string; // 1-sentence commercial payer landscape
  costNote: string; // 1-sentence regional cost context
  specificWatchouts: string[]; // 2-4 state-specific watchouts
  attorneyNote: string; // why local healthcare attorney matters here
}

export const states: StateInfo[] = [
  {
    slug: "florida",
    abbr: "FL",
    name: "Florida",
    major: ["Miami", "Tampa", "Orlando", "Jacksonville", "Fort Lauderdale"],
    medicaidName: "Florida Medicaid (AHCA)",
    medicaidTimingDays: "60–120 days",
    npAuthority: "reduced",
    paAuthorityNote: "PA practice in Florida requires a supervising physician; collaborative arrangements are state-specific and worth reviewing annually.",
    payerLandscapeNote: "BCBS of Florida (Florida Blue), Aetna, UnitedHealthcare, Humana, and Cigna dominate the commercial market; Medicare Advantage penetration is among the highest in the country.",
    costNote: "Office space costs vary widely between South Florida metros and the rest of the state; rent in Miami-Dade and Broward runs 1.5–2x markets like Jacksonville or Tampa.",
    specificWatchouts: [
      "Florida requires a separate Medical Quality Assurance (MQA) license verification step that some out-of-state physicians underestimate",
      "Medicare Advantage penetration is high — model your payer mix accordingly",
      "Hurricane preparedness and business interruption insurance are not optional in coastal practices",
      "Florida has no state income tax, but corporate franchise tax and county-specific fees still apply",
    ],
    attorneyNote:
      "Florida's healthcare regulations include specific entity rules for physician practices and CON (Certificate of Need) requirements for certain services. Work with a Florida-licensed healthcare attorney.",
  },
  {
    slug: "texas",
    abbr: "TX",
    name: "Texas",
    major: ["Houston", "Dallas-Fort Worth", "San Antonio", "Austin"],
    medicaidName: "Texas Medicaid (HHSC)",
    medicaidTimingDays: "60–120 days",
    npAuthority: "restricted",
    paAuthorityNote: "Texas requires a written delegation agreement with a supervising physician for PAs; specific protocols vary by setting.",
    payerLandscapeNote: "Blue Cross Blue Shield of Texas, UnitedHealthcare, Aetna, Cigna, and Humana lead the commercial market; rural Texas can have very thin commercial payer participation.",
    costNote: "Major metros (Austin, Dallas, Houston) have rapidly rising commercial rent; smaller markets and rural Texas offer dramatically lower startup costs but thinner payer mixes.",
    specificWatchouts: [
      "Texas has restrictive corporate practice of medicine rules — entity structure matters more here than in many states",
      "Medicaid timing in Texas can extend beyond 120 days in some windows; plan accordingly",
      "Property tax burden in Texas is higher than the no-income-tax framing suggests",
      "Rural credentialing can be slower with regional Blue plans — start earlier",
    ],
    attorneyNote:
      "Texas corporate practice of medicine doctrine is strict — the wrong entity or ownership structure can invalidate your liability protection. Use a Texas-licensed healthcare attorney.",
  },
  {
    slug: "california",
    abbr: "CA",
    name: "California",
    major: ["Los Angeles", "San Diego", "San Francisco Bay Area", "Sacramento"],
    medicaidName: "Medi-Cal",
    medicaidTimingDays: "90–180 days (often longer)",
    npAuthority: "full",
    paAuthorityNote: "California PA practice authority expanded significantly in 2023; verify current scope and supervision rules with your specialty board.",
    payerLandscapeNote: "Anthem Blue Cross, Blue Shield of California, Kaiser Permanente (closed system), Health Net, and UnitedHealthcare dominate; Medi-Cal managed care plans add complexity.",
    costNote: "California has the highest commercial rent, the most stringent compliance environment, and the largest patient base in the country — startup costs run 1.5–3x most states.",
    specificWatchouts: [
      "Medi-Cal enrollment can take 4–6 months — start very early",
      "California Professional Corporation rules require specific naming conventions and ownership structure",
      "Cal/OSHA, CMIA (state HIPAA equivalent), and CCPA add compliance layers beyond federal baseline",
      "Workers comp premiums for healthcare employees in California are among the highest in the country",
    ],
    attorneyNote:
      "California healthcare regulation is the most complex in the country — corporate practice rules, peer review, and patient privacy laws all have state-specific requirements. Local healthcare attorney is essential.",
  },
  {
    slug: "new-york",
    abbr: "NY",
    name: "New York",
    major: ["New York City", "Long Island", "Buffalo", "Rochester", "Albany"],
    medicaidName: "New York State Medicaid",
    medicaidTimingDays: "90–150 days",
    npAuthority: "full",
    paAuthorityNote: "New York PAs practice under a supervising physician; the scope of practice is broad but the written agreement requirements are specific.",
    payerLandscapeNote: "EmblemHealth, Empire BlueCross BlueShield, UnitedHealthcare, Aetna, Cigna, and MetroPlus (NYC) dominate; the NYC market is unusually fragmented compared to most states.",
    costNote: "NYC commercial rent is the highest in the country; upstate markets (Rochester, Buffalo) offer dramatically lower costs with smaller commercial payer panels.",
    specificWatchouts: [
      "New York requires Article 28 facility licensure for certain office-based services beyond what most states require",
      "NYC has a separate Department of Health Article 28 + DOH-NY enrollment process",
      "Corporate Practice of Medicine rules in New York are strict — entity structure matters",
      "Mansion tax, commercial rent tax (NYC), and other municipal fees materially affect startup costs",
    ],
    attorneyNote:
      "New York's Article 28 facility licensure rules and CPM doctrine make local counsel non-negotiable. Use a healthcare attorney with NYC and state DOH experience.",
  },
  {
    slug: "pennsylvania",
    abbr: "PA",
    name: "Pennsylvania",
    major: ["Philadelphia", "Pittsburgh", "Harrisburg", "Allentown"],
    medicaidName: "Pennsylvania Medical Assistance",
    medicaidTimingDays: "60–120 days",
    npAuthority: "reduced",
    paAuthorityNote: "Pennsylvania PAs require a written agreement with a supervising physician; specific delegation protocols apply.",
    payerLandscapeNote: "Highmark Blue Cross Blue Shield (western PA + Independence in eastern PA), UPMC Health Plan (Pittsburgh), Aetna, UnitedHealthcare, and Cigna lead; regional Blue dominance is strong.",
    costNote: "Costs vary widely between Philadelphia (high), Pittsburgh (moderate), and smaller markets (low).",
    specificWatchouts: [
      "Pennsylvania requires separate registration with the Department of State for professional entities",
      "Highmark and UPMC have aggressive narrow-network strategies; commercial credentialing in their regions can be slow",
      "Philadelphia has a city business license requirement separate from state",
      "Workers comp panels are required in Pennsylvania — plan the relationship before launch",
    ],
    attorneyNote:
      "Pennsylvania's CPM doctrine and entity rules are state-specific; the Highmark/UPMC regional dynamics also affect launch timing. Local healthcare counsel is worth the spend.",
  },
  {
    slug: "illinois",
    abbr: "IL",
    name: "Illinois",
    major: ["Chicago", "Naperville", "Rockford", "Peoria"],
    medicaidName: "Illinois Medicaid (HFS)",
    medicaidTimingDays: "90–180 days",
    npAuthority: "reduced",
    paAuthorityNote: "Illinois PAs practice with a collaborating physician; specific delegation rules apply.",
    payerLandscapeNote: "Blue Cross Blue Shield of Illinois (HCSC), UnitedHealthcare, Aetna, Cigna, and Humana lead; BCBSIL dominates the Chicago commercial market.",
    costNote: "Chicago is high-cost; downstate Illinois is moderate; commercial rent and labor follow that split closely.",
    specificWatchouts: [
      "Illinois has specific Professional Service Corporation requirements distinct from generic PC rules",
      "Cook County and Chicago add municipal compliance layers",
      "Illinois Medicaid (HFS) has a reputation for slow enrollment timing — start early",
      "State worker classification rules are strict; misclassifying 1099 vs. W-2 is risky",
    ],
    attorneyNote:
      "Illinois entity and worker classification rules require state-specific counsel; Chicago adds additional municipal complexity.",
  },
  {
    slug: "ohio",
    abbr: "OH",
    name: "Ohio",
    major: ["Columbus", "Cleveland", "Cincinnati", "Toledo"],
    medicaidName: "Ohio Medicaid",
    medicaidTimingDays: "60–120 days",
    npAuthority: "reduced",
    paAuthorityNote: "Ohio PAs require a supervising physician and a Standard Care Arrangement; protocols are specific.",
    payerLandscapeNote: "Anthem Blue Cross Blue Shield (Ohio), Medical Mutual of Ohio, UnitedHealthcare, Aetna, and Cigna lead; Medical Mutual is a unique regional player.",
    costNote: "Ohio markets are generally moderate-cost; major metros (Columbus, Cincinnati, Cleveland) cluster within a similar range.",
    specificWatchouts: [
      "Ohio requires Professional Association registration distinct from generic LLC/PC formation",
      "Medical Mutual's regional dominance means credentialing strategy varies from national-payer-first playbooks",
      "Ohio's BWC (Bureau of Workers' Compensation) is state-run; the relationship differs from private workers comp markets",
      "Pharmacy Board registration is required for in-office dispensing — start early",
    ],
    attorneyNote:
      "Ohio's state-run workers comp and Pharmacy Board rules add steps most generic startup guides miss. Local counsel matters.",
  },
  {
    slug: "georgia",
    abbr: "GA",
    name: "Georgia",
    major: ["Atlanta", "Augusta", "Savannah", "Columbus"],
    medicaidName: "Georgia Medicaid",
    medicaidTimingDays: "60–120 days",
    npAuthority: "restricted",
    paAuthorityNote: "Georgia PAs practice under a supervising physician with a written practice agreement; specific protocols apply.",
    payerLandscapeNote: "Anthem Blue Cross Blue Shield of Georgia, UnitedHealthcare, Aetna, Cigna, and Kaiser Permanente (Atlanta area) lead; Anthem is dominant.",
    costNote: "Atlanta has high commercial rent and growing labor costs; the rest of Georgia is moderate to low cost.",
    specificWatchouts: [
      "Georgia's restrictive NP scope of practice affects business model decisions if you're forming with NP partners or staff",
      "Atlanta-area credentialing can be slower with Anthem due to volume",
      "Georgia's medical license verification is fast but the licensure board requires specific entity disclosures",
      "Worker classification and non-compete enforcement in Georgia are state-specific",
    ],
    attorneyNote:
      "Georgia non-compete rules and entity disclosure requirements warrant local counsel before you sign anything.",
  },
  {
    slug: "north-carolina",
    abbr: "NC",
    name: "North Carolina",
    major: ["Charlotte", "Raleigh", "Durham", "Greensboro"],
    medicaidName: "North Carolina Medicaid (NC Medicaid Direct + managed care)",
    medicaidTimingDays: "60–120 days",
    npAuthority: "reduced",
    paAuthorityNote: "North Carolina PAs practice with a written Supervision Agreement; recent reforms have expanded scope in some settings.",
    payerLandscapeNote: "Blue Cross NC, UnitedHealthcare, Aetna, Cigna, and AmeriHealth (Medicaid) lead; Blue Cross NC has unusually strong commercial market share.",
    costNote: "Charlotte and the Triangle (Raleigh/Durham) are high-cost; smaller NC markets remain relatively affordable.",
    specificWatchouts: [
      "Blue Cross NC dominance means commercial credentialing strategy revolves around BCNC timing",
      "Recent NC Medicaid managed care transition added complexity to Medicaid credentialing — verify current pathway",
      "North Carolina has Certificate of Need (CON) requirements for certain services",
      "PA scope-of-practice reforms in NC are ongoing — verify the current rules for your specialty",
    ],
    attorneyNote:
      "NC's CON requirements and ongoing scope-of-practice reforms make local healthcare counsel important, especially for specialty practices.",
  },
  {
    slug: "washington",
    abbr: "WA",
    name: "Washington",
    major: ["Seattle", "Tacoma", "Spokane", "Bellevue"],
    medicaidName: "Washington Apple Health (Medicaid)",
    medicaidTimingDays: "60–120 days",
    npAuthority: "full",
    paAuthorityNote:
      "Washington PAs practice under a written supervision agreement with broad delegated authority; specifics vary by setting.",
    payerLandscapeNote:
      "Premera Blue Cross, Regence BlueShield, Kaiser Permanente Washington, UnitedHealthcare, and Aetna lead; Kaiser's closed system materially affects open-market access.",
    costNote:
      "Seattle and Bellevue have very high commercial rent and labor costs; smaller markets and eastern Washington are dramatically lower-cost.",
    specificWatchouts: [
      "Washington has specific patient privacy rules (My Health My Data Act) that go beyond federal HIPAA",
      "Kaiser's closed system means a meaningful share of Seattle-area patients are out of reach for non-Kaiser practices",
      "State business and occupation (B&O) tax structure is unusual — model accurately",
      "Apple Health (Medicaid) managed care has multiple plans — enrollment is per-plan",
    ],
    attorneyNote:
      "Washington's MHMDA, Kaiser dynamics, and B&O tax structure all warrant in-state healthcare counsel.",
  },
  {
    slug: "new-jersey",
    abbr: "NJ",
    name: "New Jersey",
    major: ["Newark", "Jersey City", "Paterson", "Princeton corridor"],
    medicaidName: "NJ FamilyCare (Medicaid)",
    medicaidTimingDays: "60–120 days",
    npAuthority: "reduced",
    paAuthorityNote:
      "New Jersey PAs practice under a written delegation agreement with a supervising physician; specific protocols apply.",
    payerLandscapeNote:
      "Horizon Blue Cross Blue Shield of New Jersey, AmeriHealth, UnitedHealthcare, Aetna, and Cigna lead; Horizon dominates the commercial market.",
    costNote:
      "North Jersey (Bergen, Essex, Hudson) and Princeton corridor have high commercial rent; southern New Jersey is moderate.",
    specificWatchouts: [
      "Horizon BCBS dominance shapes credentialing strategy — their timing is the gate",
      "NJ has strict corporate practice of medicine rules — entity structure matters",
      "State malpractice insurance market has limited carriers; verify before assuming national rates",
      "NJ FamilyCare is managed care — enrollment is per-plan",
    ],
    attorneyNote:
      "NJ CPM rules and the Horizon dynamic both warrant in-state healthcare counsel.",
  },
  {
    slug: "virginia",
    abbr: "VA",
    name: "Virginia",
    major: ["Northern Virginia (DC metro)", "Richmond", "Virginia Beach", "Roanoke"],
    medicaidName: "Virginia Medicaid (Cardinal Care)",
    medicaidTimingDays: "60–120 days",
    npAuthority: "reduced",
    paAuthorityNote:
      "Virginia PAs practice under a practice agreement with a supervising physician; scope varies by specialty and setting.",
    payerLandscapeNote:
      "Anthem Blue Cross Blue Shield, Sentara Health Plans, UnitedHealthcare, Aetna, and Cigna lead; Sentara is a strong regional player in eastern Virginia.",
    costNote:
      "Northern Virginia is high-cost (DC metro labor + rent); Richmond and Virginia Beach moderate; rural Virginia low.",
    specificWatchouts: [
      "Federal payer mix in Northern Virginia (Tricare, FEHB plans) is unusually significant",
      "Sentara's regional dominance in Hampton Roads affects credentialing strategy",
      "Cardinal Care managed care has multiple MCOs — enrollment is per-MCO",
      "Virginia non-compete enforcement varies; verify with local counsel before signing employment exits",
    ],
    attorneyNote:
      "VA's regional payer dynamics (Sentara in Tidewater, federal payers in NoVA) and non-compete variability warrant in-state counsel.",
  },
  {
    slug: "massachusetts",
    abbr: "MA",
    name: "Massachusetts",
    major: ["Boston", "Worcester", "Springfield", "Cambridge"],
    medicaidName: "MassHealth",
    medicaidTimingDays: "60–120 days",
    npAuthority: "full",
    paAuthorityNote:
      "Massachusetts PAs practice under a supervising physician with a written agreement; recent reforms have expanded scope.",
    payerLandscapeNote:
      "Blue Cross Blue Shield of Massachusetts, Harvard Pilgrim, Tufts Health Plan, UnitedHealthcare, and Aetna lead; the state has unusually concentrated regional health systems.",
    costNote:
      "Boston metro is among the highest-cost markets in the country; central and western Massachusetts are dramatically more affordable.",
    specificWatchouts: [
      "Massachusetts has one of the most regulated healthcare markets — DPH licensure and DRG rules add steps",
      "Strong hospital system networks (Mass General Brigham, Beth Israel Lahey) shape referral patterns more than most states",
      "State has aggressive cost-growth benchmark enforcement — large rate increases get pushback",
      "MassHealth managed care has multiple ACO and MCO options — enrollment is multi-step",
    ],
    attorneyNote:
      "Massachusetts DPH licensure, cost-growth benchmark rules, and hospital system dynamics all warrant in-state healthcare counsel.",
  },
  {
    slug: "tennessee",
    abbr: "TN",
    name: "Tennessee",
    major: ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
    medicaidName: "TennCare (Medicaid)",
    medicaidTimingDays: "60–120 days",
    npAuthority: "restricted",
    paAuthorityNote:
      "Tennessee PAs practice under a supervising physician with a written agreement; scope is generally broad in primary care settings.",
    payerLandscapeNote:
      "BlueCross BlueShield of Tennessee, Cigna, UnitedHealthcare, Aetna, and Humana lead; BCBS-TN is unusually dominant.",
    costNote:
      "Nashville commercial rent has risen rapidly; Memphis, Knoxville, and Chattanooga remain affordable; rural Tennessee very low-cost.",
    specificWatchouts: [
      "BCBS-TN dominance means commercial credentialing strategy revolves around their timing",
      "TennCare is fully managed care via three MCOs — enrollment is per-MCO",
      "Tennessee has a Certificate of Need (CON) program for certain services — verify before equipment purchase",
      "Nashville's healthcare investment community changes ownership patterns; understand the M&A landscape",
    ],
    attorneyNote:
      "Tennessee CON requirements and BCBS-TN dominance warrant in-state counsel.",
  },
  {
    slug: "arizona",
    abbr: "AZ",
    name: "Arizona",
    major: ["Phoenix", "Tucson", "Mesa", "Scottsdale"],
    medicaidName: "AHCCCS (Arizona Health Care Cost Containment System)",
    medicaidTimingDays: "60–120 days",
    npAuthority: "full",
    paAuthorityNote: "Arizona PAs practice with a delegation agreement from a supervising physician; scope is generally broad in primary care settings.",
    payerLandscapeNote: "Blue Cross Blue Shield of Arizona, UnitedHealthcare, Aetna, Cigna, and Humana lead; AHCCCS managed care plans add complexity.",
    costNote: "Phoenix metro is moderate-to-high cost with rapidly rising rent; Tucson and smaller markets remain affordable.",
    specificWatchouts: [
      "AHCCCS uses managed care extensively — Medicaid credentialing requires individual managed care organization enrollment too",
      "Arizona has a fast-growing population; underestimating patient demand in some specialties is common",
      "Phoenix metro property and rent costs are rising rapidly; lock terms early",
      "Arizona has specific entity rules for medical practices — PC vs. PLLC choice matters",
    ],
    attorneyNote:
      "AHCCCS managed care credentialing adds steps. Local counsel familiar with Arizona's entity rules and the AHCCCS system is worth the spend.",
  },
];

export const stateBySlug = Object.fromEntries(states.map((s) => [s.slug, s]));
