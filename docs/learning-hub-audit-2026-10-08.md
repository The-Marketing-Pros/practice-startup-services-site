# Learning hub and content audit — October 8, 2026

The owner requested a design/content refresh of `/journey/`, a search for similar stale pages, actual articles, and a home for eventual videos. This review covers the source route inventory and shared templates; it is not a legal or clinical review of every state/specialty statement.

## Updated in this release

| Route/family | Finding | Resolution |
| --- | --- | --- |
| `/journey/` | Older blueprint framing, crowded guidance, weak links to current tools; “isn’t a checklist” contradicted the new planner. | New visual roadmap, seven stage cards, meaningful outcomes, real PPS people, checklist/pro forma links, articles and video discovery. |
| All seven `/journey/[slug]/` pages | Older presentation, broad fixed timing and financial assertions, guide content disconnected from the editable tools. | Shared modern layout, rewritten practical guidance, qualitative dependencies, native FAQs, adjacent-stage navigation and relevant tool links. |
| `/resources/articles/` | Empty article catalog; no article detail template. | Three original published articles, accessible article layout and contents navigation, organizational authorship, dates and relevant primary sources. |
| `/resources/startup-costs/` | Unsupported price ranges, a universal reserve minimum, and break-even/collection timelines presented without sources. | Quote-driven cost categories, scenario planning, editable pro forma links and an SBA reference. No blanket cost or timing promise. |
| `/resources/medicare-tools/` | Both tools linked to the same external collection; unsupported “any code/year” and access claims; old diagonal link icons. | Distinct official CMS references, clearer scope, contextual PPS/Metolius links and standard readable links. |
| `/resources/videos/` | No dedicated destination. | New library, explicit no-recordings-yet state, three planned topics with real companion articles, and a data structure for future watch/transcript links. |
| Header, footer, home/resource hub | Article discovery buried; video discovery absent. | “Articles & videos” primary navigation, article/video secondary navigation, footer and resource cards. |
| Credentialing service summary | Shared summary repeated the unsupported 90–180-day revenue assertion inside refreshed phase guides. | Replaced with a factual description of application organization, payer follow-up and visible progress. |

## Other pages that warrant a focused follow-up

| Priority | Pages | Observed reason / next step |
| --- | --- | --- |
| High — factual refresh | `/states/` and 15 state guides | `src/data/states.ts` has fixed Medicaid timing ranges and broad ownership/legal claims (for example Texas liability language and California 4–6-month enrollment timing). Verify each against current state/payer primary sources before revising; this release does not certify those claims. |
| Medium — service positioning | `/services/` and six service pages | Existing “build crew” vocabulary and confident timeline/contract/pricing promises need a separate scope review against actual service terms. The one credentialing summary reused in this release is corrected. |
| Medium — consistency | `/about/`, `/scan/`, `/scan/results/` | Older blueprint styling and copy remain. Bring About toward team/proof and modernize scan presentation without changing its scoring or registration workflow. |
| Medium — targeted content | `/specialty/` plus 13 specialty pages; `/who-we-help/` plus five audience pages | Shared older page templates. Audit specialty-specific payer, ownership, equipment and launch assumptions before applying the new presentation. |
| Preserve current workflow | Home, resource hub, checklist, pro forma, LaborGenie claim page | Recently redesigned. Keep working planner persistence/download and registration behavior; only shared navigation/resource discovery changes here. |
| Utility / separate ownership | Privacy, terms, thank-you, 404 | Inventoried; no broad copy rewrite. Legal pages require a terms-specific review rather than a cosmetic freshness date. |

## Publishing more learning content

- Articles live in `src/data/articles.ts`; only `status: 'published'` entries create pages and cards. Give each a unique slug, useful description, explicit organizational or actual author, accurate date, unique section IDs, and a relevant tool CTA. Cite current primary sources for external claims. The date is an actual publication/review date, not a cosmetic SEO update.
- The article template currently uses `publishedAt` for its publication and modification dates. When revising previously published articles, add a separate modification/source-review field rather than overwriting the original publication date or reusing the October 8 source-consulted text.
- Video metadata lives in `src/data/videos.ts`. Add to `publishedVideos` only after the real recording and accessible transcript are available. Check caption availability on the destination player, keyboard access, HTTPS links, title and actual duration. Remove the matching planned topic, and update the library/article promotional copy when recordings go live.
- There are no invented recordings, thumbnails, play controls, or VideoObject claims. The initial library is an honest planned-content state with useful reading available immediately. The future published card branch has not been exercised with a production recording.
- Keep existing guide slugs stable. Internal links, canonical URLs and sitemap generation use those paths.

## Primary sources consulted

- [SBA — Plan your business](https://www.sba.gov/counseling/plan-your-business/)
- [CMS — Provider/supplier enrollment](https://www.cms.gov/medicare/enrollment-renewal/providers-suppliers)
- [CMS — Physician Fee Schedule lookup overview](https://www.cms.gov/medicare/physician-fee-schedule/search/overview)
- [CMS — Medicare Revalidation List](https://data.cms.gov/tools/medicare-revalidation-list)

External sources support only the linked planning/enrollment explanations, not all existing site content or an endorsement of PPS. Metolius's external collection and appointment/form fulfillment were not revalidated in this content release.
