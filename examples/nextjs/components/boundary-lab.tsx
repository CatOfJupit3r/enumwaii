"use client";

import { useReducer, useTransition } from "react";

import { inspectStatusAction } from "../app/actions";
import type { BoundaryDecision, BoundaryReport } from "../lib/boundary";
import { LAB_EVENT_CASE } from "../lib/lab-events";

interface LabScenario {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly input: unknown;
}

const LAB_SCENARIOS: readonly LabScenario[] = [
  {
    id: "valid",
    label: "Valid",
    value: '"IN_PROGRESS"',
    input: "IN_PROGRESS",
  },
  {
    id: "missing",
    label: "Missing",
    value: "undefined",
    input: undefined,
  },
  {
    id: "malformed",
    label: "Malformed",
    value: '"PAUSED"',
    input: "PAUSED",
  },
  {
    id: "wrong-type",
    label: "Wrong type",
    value: "42",
    input: 42,
  },
];

interface LabState {
  readonly selectedId: string;
  readonly report: BoundaryReport | null;
  readonly error: string | null;
}

type LabAction =
  | {
      readonly type: typeof LAB_EVENT_CASE.START;
      readonly selectedId: string;
    }
  | {
      readonly type: typeof LAB_EVENT_CASE.SUCCEED;
      readonly report: BoundaryReport;
    }
  | {
      readonly type: typeof LAB_EVENT_CASE.FAIL;
      readonly message: string;
    };

const initialState: LabState = {
  selectedId: "valid",
  report: null,
  error: null,
};

function assertNever(value: never): never {
  throw new Error(`Unhandled lab event: ${String(value)}`);
}

export function boundaryLabReducer(
  state: LabState,
  action: LabAction,
): LabState {
  switch (action.type) {
    case LAB_EVENT_CASE.START:
      return {
        selectedId: action.selectedId,
        report: state.report,
        error: null,
      };
    case LAB_EVENT_CASE.SUCCEED:
      return { ...state, report: action.report, error: null };
    case LAB_EVENT_CASE.FAIL:
      return { ...state, report: null, error: action.message };
  }

  return assertNever(action);
}

function DecisionCard({
  decision,
  title,
}: {
  readonly decision: BoundaryDecision;
  readonly title: string;
}) {
  return (
    <article
      className="decision-card"
      data-outcome={decision.accepted ? "accepted" : "rejected"}
    >
      <div className="decision-heading">
        <p>{title}</p>
        <span>{decision.source}</span>
      </div>
      {decision.accepted ? (
        <strong>{decision.status}</strong>
      ) : (
        <strong>Request rejected</strong>
      )}
      <p>{decision.explanation}</p>
    </article>
  );
}

export function BoundaryLab() {
  const [state, dispatch] = useReducer(boundaryLabReducer, initialState);
  const [isPending, startTransition] = useTransition();

  function runScenario(scenario: LabScenario): void {
    dispatch({ type: LAB_EVENT_CASE.START, selectedId: scenario.id });
    startTransition(async () => {
      try {
        const report = await inspectStatusAction(scenario.input);
        dispatch({ type: LAB_EVENT_CASE.SUCCEED, report });
      } catch (error) {
        dispatch({
          type: LAB_EVENT_CASE.FAIL,
          message:
            error instanceof Error
              ? error.message
              : "The server boundary could not be reached.",
        });
      }
    });
  }

  return (
    <section className="boundary-section" id="boundary-lab">
      <div className="section-heading boundary-heading">
        <div>
          <p className="eyebrow">Interactive boundary lab</p>
          <h2>Watch untrusted values cross the server boundary.</h2>
        </div>
        <p>
          Choose a payload. A typed Server Action receives it as unknown and
          compares a nil-only default with an invalid-input fallback.
        </p>
      </div>

      <div className="lab-shell">
        <div className="scenario-panel">
          <p className="panel-kicker">Incoming status</p>
          <div className="scenario-grid" role="group" aria-label="Lab payloads">
            {LAB_SCENARIOS.map((scenario) => (
              <button
                aria-pressed={state.selectedId === scenario.id}
                className="scenario-button"
                disabled={isPending}
                key={scenario.id}
                onClick={() => runScenario(scenario)}
                type="button"
              >
                <span>{scenario.label}</span>
                <code>{scenario.value}</code>
              </button>
            ))}
          </div>
          <p className="lab-footnote">
            The same parser also powers <code>POST /api/inspect</code> for JSON
            clients.
          </p>
        </div>

        <div className="result-panel" aria-live="polite">
          <div className="result-topline">
            <p className="panel-kicker">Policy result</p>
            {isPending ? <span className="loading-dot">Checking…</span> : null}
          </div>

          {state.error ? <p className="lab-error">{state.error}</p> : null}

          {state.report ? (
            <>
              <p className="input-readout">
                Received <strong>{state.report.input.display}</strong>
                <span>{state.report.input.kind}</span>
              </p>
              <div className="decision-grid">
                <DecisionCard
                  decision={state.report.defaultOnly}
                  title="Default only"
                />
                <DecisionCard
                  decision={state.report.recovery}
                  title="Default + fallback"
                />
              </div>
            </>
          ) : (
            <div className="lab-placeholder">
              <span>↳</span>
              <p>Select a payload to inspect both policies on the server.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
