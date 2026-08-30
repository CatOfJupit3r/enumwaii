import Link from "next/link";

import { BoundaryLab } from "../components/boundary-lab";
import { OperationsTable } from "../components/operations-table";
import {
  OPERATION_TASKS,
  TASK_STATUS,
  allTaskStatuses,
  countTasks,
  resolveDashboardStatus,
  statusMetadata,
  tasksForStatus,
  type TaskStatus,
} from "../lib/operations";

interface DashboardPageProps {
  readonly searchParams: Promise<{
    readonly status?: string | readonly string[];
  }>;
}

const timeline = [
  {
    time: "09:12",
    title: "West hub sync restored",
    detail: "Backlog processing resumed automatically.",
  },
  {
    time: "09:26",
    title: "Compliance review requested",
    detail: "OPS-2848 moved into intervention.",
  },
  {
    time: "09:41",
    title: "Morning release window opened",
    detail: "Two verified batches are ready for pickup.",
  },
] as const;

function StatusTab({
  selected,
  status,
}: {
  readonly selected: boolean;
  readonly status: TaskStatus;
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
      <strong>{countTasks(status)}</strong>
    </Link>
  );
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const resolution = resolveDashboardStatus(params.status);
  const selectedMetadata = statusMetadata(resolution.status);
  const visibleTasks = tasksForStatus(resolution.status);
  const completedCount = countTasks(TASK_STATUS.COMPLETE);
  const completion = Math.round(
    (completedCount / OPERATION_TASKS.length) * 100,
  );

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">S</span>
          <span>
            <strong>Signal Desk</strong>
            <small>Operations control</small>
          </span>
        </Link>
        <nav aria-label="Page sections">
          <Link href="/">Live queue</Link>
          <Link href="#boundary-lab">Boundary lab</Link>
        </nav>
        <span className="live-pill">
          <i /> Systems nominal
        </span>
      </header>

      <div className="page-shell">
        <section className="hero">
          <div>
            <p className="eyebrow">Friday dispatch · EU region</p>
            <h1>Keep every handoff moving.</h1>
            <p className="hero-copy">
              A live operating view for the teams watching releases,
              dependencies, and customer-critical exceptions.
            </p>
          </div>
          <div className="hero-stamp">
            <span>Window 04</span>
            <strong>09:48</strong>
            <small>Local operations time</small>
          </div>
        </section>

        <section className="metric-grid" aria-label="Shift metrics">
          <article className="metric-card metric-card-accent">
            <span>Ready now</span>
            <strong>{countTasks(TASK_STATUS.QUEUED)}</strong>
            <small>Verified tasks without an owner</small>
          </article>
          <article className="metric-card">
            <span>In motion</span>
            <strong>{countTasks(TASK_STATUS.IN_PROGRESS)}</strong>
            <small>Active delivery windows</small>
          </article>
          <article className="metric-card">
            <span>Interventions</span>
            <strong>{countTasks(TASK_STATUS.BLOCKED)}</strong>
            <small>Decisions or dependencies needed</small>
          </article>
          <article className="metric-card completion-card">
            <div>
              <span>Shift completion</span>
              <strong>{completion}%</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${completion}%` }} />
            </div>
            <small>{completedCount} verified handoffs delivered</small>
          </article>
        </section>

        <div className="dashboard-grid">
          <section className="queue-panel">
            <div className="queue-header">
              <div>
                <p className="eyebrow">Operating queue</p>
                <h2>{selectedMetadata.label}</h2>
                <p>{selectedMetadata.description}</p>
              </div>
              <span className={`policy-note policy-${resolution.policy}`}>
                {resolution.policy}
              </span>
            </div>

            <div className="status-tabs" aria-label="Filter by task status">
              {allTaskStatuses().map((status) => (
                <StatusTab
                  key={status}
                  selected={status === resolution.status}
                  status={status}
                />
              ))}
            </div>

            {resolution.policy === "request" ? null : (
              <p className="boundary-notice">{resolution.notice}</p>
            )}

            <OperationsTable tasks={visibleTasks} />
          </section>

          <aside className="pulse-panel">
            <div className="pulse-header">
              <div>
                <p className="eyebrow">Shift pulse</p>
                <h2>Recent signals</h2>
              </div>
              <span>Live</span>
            </div>
            <ol className="timeline">
              {timeline.map((item) => (
                <li key={item.time}>
                  <time>{item.time}</time>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="ownership-card">
              <span>On-call lead</span>
              <div>
                <i>ND</i>
                <p>
                  <strong>Nadia Dobrev</strong>
                  <small>Response target · under 8 min</small>
                </p>
              </div>
            </div>
          </aside>
        </div>

        <BoundaryLab />

        <footer>
          <p>Signal Desk</p>
          <span>Next.js App Router · enumwaii boundary patterns</span>
        </footer>
      </div>
    </main>
  );
}
