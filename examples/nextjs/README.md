# Byline - Next.js + enumwaii

Byline is the article pipeline dashboard of a small newsroom: a first draft moves through review and approval to publication or the archive.

Run: pnpm --dir examples/nextjs dev

The Server Component validates ?status=: no filter shows all articles, while an unrecognized shared link visibly falls back to drafts. The TanStack table renders real-looking articles, authors, and word counts. ArticleStatus.pick([PUBLISHED, ARCHIVED]) defines the only statuses available to public sitemap code.

The editorial review Client Component uses extracted .cases members as reducer discriminants. The API CMS webhook at POST /api/webhooks/cms remains an inbound-CMS-shaped unknown JSON parser so default and fallback behavior are testable at a realistic CMS webhook.

Validate: pnpm --dir examples/nextjs test; pnpm --dir examples/nextjs test:types; pnpm --dir examples/nextjs build
