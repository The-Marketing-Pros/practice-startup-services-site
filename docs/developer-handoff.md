# Developer handoff

Repository: `The-Marketing-Pros/practice-startup-services-site`. Main baseline: `c13072b7dcd42e88e8be775cf11b171db7ee9889`.

Astro/Tailwind static site deployed through Cloudflare Pages.

## Verification

New PR verification runs npm ci, the existing Astro check command and the production build.

```sh
npm ci
npm run check
npm run build
```

Run the gate regression tests with `python3 -m unittest discover -s .github/scripts -p 'test_*.py' -v`. All PR change categories trigger `.github/workflows/engineering-protocol.yml`; missing, skipped, failed or cancelled required jobs fail the aggregate. A failed whole workflow or provider outage remains non-successful.

## Known limits

Hosting, form/scheduling destinations and browser accessibility are separate acceptance. No live deployment or asset replacement is performed.

No application source, data, file or branch is deleted by this rollout. Existing deployment workflows retain their own triggers; a feature-branch push may create an existing provider preview. No production deployment is authorized by the protocol.
