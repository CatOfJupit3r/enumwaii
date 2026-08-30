<script setup lang="ts">
import { computed, ref } from "vue";

import AccessLevelCard from "./components/AccessLevelCard.vue";
import AccessRequestForm from "./components/AccessRequestForm.vue";
import BoundaryPlayground from "./components/BoundaryPlayground.vue";
import { useAccessLevelPersistence } from "./composables/useAccessLevelPersistence";
import {
  ACCESS_LEVEL_VALUES,
  ACCESS_LEVELS,
  canAccess,
  describeAccessLevel,
  describePermission,
  PERMISSION_VALUES,
  policyLabel,
  permissionsFor,
  type AccessInvitation,
  type AccessLevel,
  type AccessPolicy,
} from "./domain/access-control";

const persistence = useAccessLevelPersistence({
  initial: ACCESS_LEVELS.VIEWER,
  policy: "nil-default",
});
const currentLevel = persistence.level;
const selectedPolicy = persistence.policy;
const rawPayload = persistence.rawInput;
const serializedLevel = persistence.serializedLevel;

const policies: readonly AccessPolicy[] = ["strict", "nil-default", "fallback"];
const levelMetadata = computed(() => describeAccessLevel(currentLevel.value));
const activePermissions = computed(() => permissionsFor(currentLevel.value));
const permissionRows = computed(() =>
  PERMISSION_VALUES.map((permission) => ({
    permission,
    metadata: describePermission(permission),
    granted: canAccess(currentLevel.value, permission),
  })),
);
const recentInvitations = ref<readonly AccessInvitation[]>([]);

const rawInputLabel = computed(() => formatUnknown(rawPayload.value));
const persistenceStateLabel = computed(() =>
  persistence.outcome.value === "accepted"
    ? "Boundary accepted"
    : "Boundary rejected",
);

function selectLevel(level: AccessLevel): void {
  persistence.setFromExternal(level);
}

function applyBoundaryLevel(level: AccessLevel): void {
  persistence.setFromExternal(level);
}

function recordInvitation(invitation: AccessInvitation): void {
  recentInvitations.value = [invitation, ...recentInvitations.value].slice(
    0,
    3,
  );
}

function formatUnknown(input: unknown): string {
  if (input === undefined) return "undefined";
  if (input === null) return "null";
  if (typeof input === "string") return `"${input}"`;
  return "object";
}

function sourceLabel(): string {
  if (persistence.source.value === "localStorage") return "localStorage";
  if (persistence.source.value === "url") return "URL query";
  if (persistence.source.value === "external") return "component event";
  return "nil default";
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="enumwaii access console home">
        <span class="brand__mark" aria-hidden="true"><i /><i /><i /></span>
        <span class="brand__name">enumwaii</span>
        <span class="brand__slash">/</span>
        <span class="brand__product">access console</span>
      </a>
      <div class="topbar__right">
        <span class="runtime-chip"
          ><span class="runtime-chip__dot" /> Vue 3.5 + TypeScript</span
        >
        <a class="topbar__link" href="#invite"
          >Invite flow <span aria-hidden="true">↘</span></a
        >
        <a class="topbar__link" href="#boundary"
          >Boundary lab <span aria-hidden="true">↗</span></a
        >
      </div>
    </header>

    <main id="top" class="page-content">
      <section class="hero">
        <div class="hero__copy">
          <p class="section-kicker">Role control plane · live session</p>
          <h1>Access that stays<br /><em>honest</em> at the edge.</h1>
          <p class="hero__lede">
            Explore a branded access level moving from an untrusted persistence
            boundary into reactive Vue state—without quietly coercing bad input.
          </p>
          <div class="hero__proof">
            <span class="proof-icon" aria-hidden="true">✓</span>
            <span
              ><strong>One parse boundary.</strong> The rest of the console only
              sees branded values.</span
            >
          </div>
        </div>

        <aside class="session-card" aria-label="Current persisted session">
          <div class="session-card__topline">
            <span class="session-card__label">Current session</span>
            <span class="live-indicator"><span /> Live</span>
          </div>
          <div class="session-card__level">
            <span
              class="session-card__avatar"
              :class="`avatar--${levelMetadata.accent}`"
            >
              {{ levelMetadata.label.slice(0, 1) }}
            </span>
            <div>
              <strong>{{ levelMetadata.label }}</strong>
              <span>{{ levelMetadata.eyebrow }}</span>
            </div>
          </div>
          <label class="policy-select">
            <span>Boundary policy</span>
            <select v-model="selectedPolicy">
              <option v-for="policy in policies" :key="policy" :value="policy">
                {{ policyLabel(policy) }}
              </option>
            </select>
          </label>
          <div class="session-card__sync">
            <span class="sync-icon" aria-hidden="true">⌁</span>
            <span>Synced from {{ sourceLabel() }}</span>
            <code>?level={{ serializedLevel }}</code>
          </div>
        </aside>
      </section>

      <section class="metric-strip" aria-label="Current access summary">
        <div class="metric">
          <span class="metric__label">Access level</span>
          <strong>{{ levelMetadata.label }}</strong>
          <span class="metric__hint">{{ levelMetadata.description }}</span>
        </div>
        <div class="metric metric--accent">
          <span class="metric__label">Control score</span>
          <strong>{{ levelMetadata.rank }}<small>/4</small></strong>
          <span class="metric__hint">ranked by capability</span>
        </div>
        <div class="metric">
          <span class="metric__label">Granted now</span>
          <strong>{{ activePermissions.length }}<small>/4</small></strong>
          <span class="metric__hint">permissions available</span>
        </div>
        <div class="metric metric--status">
          <span class="metric__label">Boundary status</span>
          <strong>{{ persistenceStateLabel }}</strong>
          <span class="metric__hint"
            >raw payload: <code>{{ rawInputLabel }}</code></span
          >
        </div>
      </section>

      <section class="section-block" aria-labelledby="level-heading">
        <div class="section-heading">
          <div>
            <p class="section-kicker">01 · Branded state</p>
            <h2 id="level-heading">Choose a session lens</h2>
          </div>
          <p>
            Every card emits an <code>AccessLevel</code>, never a plain string.
          </p>
        </div>
        <div class="level-grid">
          <AccessLevelCard
            v-for="level in ACCESS_LEVEL_VALUES"
            :key="level"
            :level="level"
            :metadata="describeAccessLevel(level)"
            :permissions="permissionsFor(level)"
            :selected="level === currentLevel"
            @select="selectLevel"
          />
        </div>
      </section>

      <section
        class="section-block permission-section"
        aria-labelledby="permission-heading"
      >
        <div class="section-heading">
          <div>
            <p class="section-kicker">02 · Derived policy</p>
            <h2 id="permission-heading">
              What can {{ levelMetadata.label }} do?
            </h2>
          </div>
          <span class="derived-badge"
            ><span>◆</span> deriveTo · exhaustive map</span
          >
        </div>
        <div class="permission-panel panel">
          <div class="permission-panel__intro">
            <div
              class="permission-panel__icon"
              :class="`avatar--${levelMetadata.accent}`"
            >
              {{ levelMetadata.label.slice(0, 1) }}
            </div>
            <div>
              <h3>{{ levelMetadata.label }} permissions</h3>
              <p>{{ levelMetadata.description }}</p>
            </div>
            <span class="permission-count"
              >{{ activePermissions.length }} granted</span
            >
          </div>
          <div class="permission-list">
            <div
              v-for="row in permissionRows"
              :key="row.permission"
              class="permission-row"
            >
              <span
                class="permission-row__status"
                :class="{ 'permission-row__status--on': row.granted }"
              >
                {{ row.granted ? "✓" : "—" }}
              </span>
              <span class="permission-row__name">{{ row.metadata.label }}</span>
              <span class="permission-row__description">{{
                row.metadata.description
              }}</span>
              <span class="permission-row__state">{{
                row.granted ? "Granted" : "Locked"
              }}</span>
            </div>
          </div>
          <div class="permission-panel__note">
            <span aria-hidden="true">ⓘ</span>
            Permissions are derived from the access enum, so new members cannot
            silently skip policy metadata.
          </div>
        </div>
      </section>

      <section
        id="invite"
        class="section-block invitation-section anchor-target"
        aria-labelledby="invitation-heading"
      >
        <div class="section-heading">
          <div>
            <p class="section-kicker">03 · Native form boundary</p>
            <h2 id="invitation-heading">Provision access at the boundary</h2>
          </div>
          <p>Vue refs in; a parsed <code>AccessLevel</code> event out.</p>
        </div>

        <div class="invitation-grid">
          <AccessRequestForm @created="recordInvitation" />

          <aside class="invitation-ledger panel" aria-live="polite">
            <div class="invitation-ledger__heading">
              <div>
                <span>Local activity</span>
                <h3>Invitation queue</h3>
              </div>
              <strong>{{ recentInvitations.length }}</strong>
            </div>

            <p v-if="recentInvitations.length === 0" class="invitation-empty">
              Submitted invitations appear here with the branded access level
              that crossed the component event.
            </p>
            <ol v-else class="invitation-list">
              <li
                v-for="(invitation, index) in recentInvitations"
                :key="`${invitation.email}-${index}`"
              >
                <span
                  class="invitation-avatar"
                  :class="`avatar--${describeAccessLevel(invitation.level).accent}`"
                >
                  {{ invitation.email.slice(0, 1).toUpperCase() }}
                </span>
                <div>
                  <strong>{{ invitation.email }}</strong>
                  <small>
                    {{ describeAccessLevel(invitation.level).label }} access
                    <template v-if="invitation.note">
                      · {{ invitation.note }}
                    </template>
                  </small>
                </div>
                <code>{{ invitation.level }}</code>
              </li>
            </ol>

            <p class="invitation-ledger__note">
              This list is intentionally local UI state. Refresh to clear it.
            </p>
          </aside>
        </div>
      </section>

      <div id="boundary" class="anchor-target" />
      <BoundaryPlayground
        :active-level="currentLevel"
        @apply="applyBoundaryLevel"
      />

      <section class="architecture-strip" aria-label="Architecture summary">
        <div class="architecture-strip__intro">
          <p class="section-kicker">Under the hood</p>
          <h2>Small boundary.<br /><em>Clear guarantees.</em></h2>
        </div>
        <div class="architecture-step">
          <span class="architecture-step__number">01</span>
          <strong>Extract once</strong>
          <span
            ><code>accessLevelEnum.enum</code> is the only member view.</span
          >
        </div>
        <div class="architecture-step">
          <span class="architecture-step__number">02</span>
          <strong>Parse unknown</strong>
          <span>URL and storage payloads are checked before refs update.</span>
        </div>
        <div class="architecture-step">
          <span class="architecture-step__number">03</span>
          <strong>Derive policy</strong>
          <span
            >Permission grants stay exhaustive with <code>deriveTo</code>.</span
          >
        </div>
      </section>
    </main>

    <footer class="footer">
      <span>enumwaii · nominal strings for boundaries you can trust</span>
      <span
        >Vue Composition API showcase <span aria-hidden="true">✦</span></span
      >
    </footer>
  </div>
</template>
