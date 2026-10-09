// Add a recording only when its watch URL and accessible transcript are ready.
// Planned topics are not playable content and never emit VideoObject schema.
export interface PublishedVideo {
  title: string;
  description: string;
  watchUrl: string;
  transcriptUrl: string;
  durationLabel: string;
}
export const publishedVideos: PublishedVideo[] = [];
export const plannedVideoTopics = [
  {title:'Build your launch checklist',description:'A walkthrough of tasks, owners, dates, and editable downloads.',articleSlug:'turn-your-startup-checklist-into-a-working-plan'},
  {title:'Work through your startup numbers',description:'A guided look at the pro forma builder and the assumptions behind your plan.',articleSlug:'build-a-practice-startup-budget-you-can-update'},
  {title:'Get organized for credentialing',description:'How to keep document preparation and payer follow-up visible.',articleSlug:'organize-credentialing-before-you-apply'}
];
