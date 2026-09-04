import Link from "next/link";

import { ReviewPanel } from "../components/review-panel";
import { ArticlesTable } from "../components/articles-table";
import {
  ARTICLE_STATUS,
  STATUS_RESOLUTION_POLICY,
  allArticleStatuses,
  articlesForStatus,
  countArticles,
  resolveDashboardStatus,
  statusMetadata,
  type ArticleStatus,
} from "../lib/articles";

interface DashboardPageProps {
  readonly searchParams: Promise<{
    readonly status?: string | readonly string[];
  }>;
}

function StatusTab({
  selected,
  status,
}: {
  readonly selected: boolean;
  readonly status: ArticleStatus;
}) {
  const metadata = statusMetadata(status);
  return (
    <Link
      aria-current={selected ? "page" : undefined}
      className="status-tab"
      data-selected={selected}
      href={{ pathname: "/", query: { status } }}
    >
      <span>{metadata.shortLabel}</span>
      <strong>{countArticles(status)}</strong>
    </Link>
  );
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const resolution = resolveDashboardStatus(params.status);
  const visibleArticles = articlesForStatus(resolution.status);
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">B</span>
          <span>
            <strong>Byline</strong>
            <small>Editorial publishing desk</small>
          </span>
        </Link>
        <nav aria-label="Page sections">
          <Link href="/">Article desk</Link>
          <Link href="#review">Review panel</Link>
        </nav>
        <span className="live-pill">
          <i /> Edition in progress
        </span>
      </header>
      <div className="page-shell">
        <section className="hero">
          <div>
            <p className="eyebrow">Friday edition · newsroom</p>
            <h1>Every story finds its moment.</h1>
            <p className="hero-copy">
              Byline is a small newsroom’s view of the work between first draft
              and publication.
            </p>
          </div>
          <div className="hero-stamp">
            <span>Edition 34</span>
            <strong>09:48</strong>
            <small>Local newsroom time</small>
          </div>
        </section>
        <section className="metric-grid" aria-label="Editorial metrics">
          <article className="metric-card metric-card-accent">
            <span>In review</span>
            <strong>{countArticles(ARTICLE_STATUS.IN_REVIEW)}</strong>
            <small>Stories with an editor</small>
          </article>
          <article className="metric-card">
            <span>Approved</span>
            <strong>{countArticles(ARTICLE_STATUS.APPROVED)}</strong>
            <small>Ready for a publication slot</small>
          </article>
          <article className="metric-card">
            <span>Live</span>
            <strong>{countArticles(ARTICLE_STATUS.PUBLISHED)}</strong>
            <small>Stories available to readers</small>
          </article>
          <article className="metric-card completion-card">
            <span>Public sitemap</span>
            <strong>2</strong>
            <small>Statuses admitted by ArticleStatus.pick()</small>
          </article>
        </section>
        <section className="queue-panel">
          <div className="queue-header">
            <div>
              <p className="eyebrow">Article pipeline</p>
              <h2>
                {resolution.status === null
                  ? "All articles"
                  : statusMetadata(resolution.status).label}
              </h2>
              <p>{resolution.notice}</p>
            </div>
            <span className={"policy-note policy-" + resolution.policy}>
              {resolution.policy}
            </span>
          </div>
          <div className="status-tabs" aria-label="Filter articles by status">
            {allArticleStatuses().map((status) => (
              <StatusTab
                key={status}
                selected={status === resolution.status}
                status={status}
              />
            ))}
          </div>
          {resolution.policy === STATUS_RESOLUTION_POLICY.REQUEST ? null : (
            <p className="boundary-notice">{resolution.notice}</p>
          )}
          <ArticlesTable articles={visibleArticles} />
        </section>
        <div id="review">
          <ReviewPanel />
        </div>
        <footer>
          <p>Byline</p>
          <span>Next.js App Router · enumwaii article boundaries</span>
        </footer>
      </div>
    </main>
  );
}
