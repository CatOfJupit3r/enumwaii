<script setup lang="ts">
import { em, type InferEnumwaii } from "enumwaii";
import { computed, ref } from "vue";

import AccessRequestForm from "./components/AccessRequestForm.vue";
import MemberRoleSelect from "./components/MemberRoleSelect.vue";
import { useAccessLevelPersistence } from "./composables/useAccessLevelPersistence";
import {
  ACCESS_LEVELS,
  ACCESS_LEVEL_VALUES,
  ACCESS_POLICY,
  canAccess,
  describeAccessLevel,
  describePermission,
  PERMISSION_VALUES,
  parseAccessLevel,
  type AccessInvitation,
  type AccessLevel,
} from "./domain/access-control";

const memberStatuses = em(["ACTIVE", "INVITED"]);
const MEMBER_STATUS = memberStatuses.enum;
type MemberStatus = InferEnumwaii<typeof memberStatuses>;

interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly team: string;
  readonly lastActive: string;
  readonly status: MemberStatus;
  readonly level: AccessLevel;
}

const members = ref<readonly TeamMember[]>([
  {
    id: "maya",
    name: "Maya Okafor",
    email: "maya@northstar.studio",
    initials: "MO",
    team: "Product",
    lastActive: "2 min ago",
    status: MEMBER_STATUS.ACTIVE,
    level: ACCESS_LEVELS.OWNER,
  },
  {
    id: "jonas",
    name: "Jonas Berg",
    email: "jonas@northstar.studio",
    initials: "JB",
    team: "Engineering",
    lastActive: "18 min ago",
    status: MEMBER_STATUS.ACTIVE,
    level: ACCESS_LEVELS.EDITOR,
  },
  {
    id: "priya",
    name: "Priya Shah",
    email: "priya@northstar.studio",
    initials: "PS",
    team: "Research",
    lastActive: "1 hr ago",
    status: MEMBER_STATUS.ACTIVE,
    level: ACCESS_LEVELS.EDITOR,
  },
  {
    id: "lucas",
    name: "Lucas Moreau",
    email: "lucas@northstar.studio",
    initials: "LM",
    team: "Finance",
    lastActive: "Yesterday",
    status: MEMBER_STATUS.ACTIVE,
    level: ACCESS_LEVELS.VIEWER,
  },
  {
    id: "nora",
    name: "Nora Kim",
    email: "nora@northstar.studio",
    initials: "NK",
    team: "Customer success",
    lastActive: "3 days ago",
    status: MEMBER_STATUS.ACTIVE,
    level: ACCESS_LEVELS.VIEWER,
  },
  {
    id: "elliot",
    name: "Elliot Reed",
    email: "elliot@northstar.studio",
    initials: "ER",
    team: "Freelance",
    lastActive: "Invite sent today",
    status: MEMBER_STATUS.INVITED,
    level: ACCESS_LEVELS.GUEST,
  },
]);

const persistence = useAccessLevelPersistence({
  initial: ACCESS_LEVELS.VIEWER,
});
const viewingAs = persistence.level;
const previewLevel = ref<AccessLevel | null>(null);
const recentInvitations = ref<readonly AccessInvitation[]>([]);

const matrixLevel = computed(() => previewLevel.value ?? viewingAs.value);
const matrixMetadata = computed(() => describeAccessLevel(matrixLevel.value));
const permissionRows = computed(() =>
  PERMISSION_VALUES.map((permission) => ({
    permission,
    metadata: describePermission(permission),
    granted: canAccess(matrixLevel.value, permission),
  })),
);

function updateViewingRole(event: Event): void {
  if (!(event.currentTarget instanceof HTMLSelectElement)) return;
  const result = parseAccessLevel(
    event.currentTarget.value,
    ACCESS_POLICY.STRICT,
  );
  if (result.success) persistence.setFromExternal(result.value);
}

function updateMemberRole(memberId: string, level: AccessLevel): void {
  members.value = members.value.map((member) =>
    member.id === memberId ? { ...member, level } : member,
  );
  previewLevel.value = level;
}

function recordInvitation(invitation: AccessInvitation): void {
  recentInvitations.value = [invitation, ...recentInvitations.value].slice(
    0,
    3,
  );
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Crewboard home">
        <span class="brand__mark" aria-hidden="true"><i /><i /><i /></span>
        <span class="brand__name">Crewboard</span>
        <span class="brand__slash">/</span>
        <span class="brand__product">members & permissions</span>
      </a>
      <div class="topbar__right">
        <span class="runtime-chip"
          ><span class="runtime-chip__dot" /> Vue 3 + TypeScript</span
        >
        <a class="topbar__link" href="#invite"
          >Invite teammate <span aria-hidden="true">↘</span></a
        >
      </div>
    </header>

    <main id="top" class="crewboard-page">
      <section class="crewboard-hero">
        <div>
          <p class="section-kicker">Northstar Studio · Team settings</p>
          <h1>Members &amp; permissions</h1>
          <p>
            Manage six teammates, preview exactly what every role can do, and
            invite collaborators without letting raw form or persistence values
            leak into application state.
          </p>
        </div>

        <label class="view-as-control">
          <span>Viewing settings as</span>
          <select
            class="view-as-select"
            :value="viewingAs"
            @change="updateViewingRole"
          >
            <option
              v-for="level in ACCESS_LEVEL_VALUES"
              :key="level"
              :value="level"
            >
              {{ describeAccessLevel(level).label }}
            </option>
          </select>
          <small>?as={{ persistence.serializedLevel.value }}</small>
        </label>
      </section>

      <p
        v-if="persistence.message.value"
        class="boundary-notice"
        :data-outcome="persistence.outcome.value"
        role="status"
      >
        {{ persistence.message.value }}
      </p>

      <div class="settings-grid">
        <section class="members-panel panel" aria-labelledby="members-heading">
          <div class="panel__header">
            <div>
              <p class="section-kicker">Workspace access</p>
              <h2 id="members-heading">Members</h2>
            </div>
            <span class="member-count">{{ members.length }} people</span>
          </div>

          <div class="member-table-wrap">
            <table class="member-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Team</th>
                  <th>Last active</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="member in members"
                  :key="member.id"
                  class="member-row"
                  @focusin="previewLevel = member.level"
                  @mouseenter="previewLevel = member.level"
                  @mouseleave="previewLevel = null"
                >
                  <td>
                    <span class="member-avatar">{{ member.initials }}</span>
                    <span class="member-identity">
                      <strong>{{ member.name }}</strong>
                      <small>{{ member.email }}</small>
                    </span>
                  </td>
                  <td>{{ member.team }}</td>
                  <td>
                    <span
                      class="member-presence"
                      :data-status="member.status"
                    />
                    {{ member.lastActive }}
                  </td>
                  <td>
                    <MemberRoleSelect
                      :level="member.level"
                      :member-id="member.id"
                      @update="updateMemberRole"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside class="permission-matrix panel" aria-live="polite">
          <p class="section-kicker">Live role preview</p>
          <h2>{{ matrixMetadata.label }}</h2>
          <p>{{ matrixMetadata.description }}</p>

          <div class="matrix-list">
            <div
              v-for="row in permissionRows"
              :key="row.permission"
              class="matrix-row"
              :data-granted="row.granted"
            >
              <span>{{ row.granted ? "✓" : "—" }}</span>
              <div>
                <strong>{{ row.metadata.label }}</strong>
                <small>{{ row.metadata.description }}</small>
              </div>
            </div>
          </div>

          <p class="matrix-note">
            Hover or focus any teammate to preview the exhaustive
            <code>deriveTo</code> permission table.
          </p>
        </aside>
      </div>

      <section
        id="invite"
        class="invite-settings panel"
        aria-labelledby="invite-heading"
      >
        <div>
          <p class="section-kicker">Add a collaborator</p>
          <h2 id="invite-heading">Invite a teammate</h2>
          <p>
            Owner is deliberately unavailable: the form renders the
            <code>.omit()</code> subset and strictly parses the DOM value before
            emitting it.
          </p>
          <AccessRequestForm @created="recordInvitation" />
        </div>

        <aside class="invitation-ledger" aria-live="polite">
          <div class="invitation-ledger__heading">
            <div>
              <span>Recent activity</span>
              <h3>Invitation queue</h3>
            </div>
            <strong>{{ recentInvitations.length }}</strong>
          </div>
          <p v-if="recentInvitations.length === 0" class="invitation-empty">
            New invitations will appear here.
          </p>
          <ol v-else class="invitation-list">
            <li
              v-for="(invitation, index) in recentInvitations"
              :key="`${invitation.email}-${index}`"
            >
              <span class="invitation-avatar">
                {{ invitation.email.slice(0, 1).toUpperCase() }}
              </span>
              <div>
                <strong>{{ invitation.email }}</strong>
                <small>
                  {{ describeAccessLevel(invitation.level).label }} access
                </small>
              </div>
              <code>{{ invitation.level }}</code>
            </li>
          </ol>
        </aside>
      </section>
    </main>

    <footer class="footer">
      <span>Crewboard · Members &amp; Permissions</span>
      <span>enumwaii × Vue 3 <span aria-hidden="true">✦</span></span>
    </footer>
  </div>
</template>
