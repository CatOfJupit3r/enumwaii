# Crewboard — Members & Permissions

**Pitch:** The team-settings screen of a fictional SaaS, with role changes, permission previews, and a safe invitation boundary.

This runnable Vue 3 + Vite application opens as one coherent settings product: six named teammates, per-row role controls, a live permission matrix, and an invite form. There is no boundary lab—the boundary behavior appears where a real user encounters it.

## Product flow

- Hover or focus a teammate to preview that role’s permissions from the exhaustive access-level → permission `.deriveTo()` table.
- Change a row’s role through `MemberRoleSelect`. Its native DOM string is strictly parsed before the component emits a branded `AccessLevel`.
- Invite a teammate with the native Vue form. The role list comes from `accessLevelEnum.omit([OWNER])`, so ownership cannot be granted through an invitation.
- Change “Viewing settings as” to persist the role in `?as=` and `localStorage`.

## Real boundary moments

The persistence composable applies a policy based on where the unknown value came from:

| Situation | Policy | User experience |
| --- | --- | --- |
| Fresh visit | nil-only `default` | starts as Viewer |
| Tampered `?as=SUPERADMIN` link | explicit `fallback` | shows Viewer with an “unknown role” notice |
| Corrupt localStorage | strict parse | removes the corrupt value and explains the reset |

Raw URL, storage, and form strings never enter the member table or permission matrix. Those surfaces only accept owned enumwaii members.

## Enumwaii coverage

- `.enum` and `.values` render role controls.
- `.derive()` owns role and permission presentation.
- `.deriveTo()` owns the exhaustive permission matrix.
- `.omit()` defines the invitation-safe role subset.
- `parse`, `safeParse`, `default`, and `fallback` protect browser and form boundaries.

## Commands

```sh
pnpm --dir examples/vue dev
pnpm --dir examples/vue test
pnpm --dir examples/vue test:types
pnpm --dir examples/vue build
```

`dev` serves Crewboard through Vite. All teammates and invitation activity are local demo data; refresh to reset the table and queue.
