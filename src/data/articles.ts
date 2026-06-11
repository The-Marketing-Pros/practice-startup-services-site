// Articles index — Press seeds long-form content here.
// Each article lives at /resources/articles/[slug] and has the same editorial styling as the rest of the resources.

export interface Article {
  slug: string;
  title: string;
  description: string; // 1-2 sentence summary used in card + meta description
  publishedAt: string; // ISO date
  author: string;
  readMinutes: number;
  status: "draft" | "published";
  topics: string[]; // tags for indexing
  // Body lives in src/pages/resources/articles/<slug>.astro
}

export const articles: Article[] = [
  // Press will seed real articles here. Schema reserved.
];

export const publishedArticles = articles.filter((a) => a.status === "published");
