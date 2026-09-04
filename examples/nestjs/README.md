# Helpdesk - NestJS + Mongoose + enumwaii

Helpdesk is a support-ticket backend with severity SLAs and an agent dashboard.

Run: pnpm --dir examples/nestjs dev

Tickets move through OPEN -> IN_PROGRESS -> WAITING_ON_CUSTOMER -> RESOLVED -> CLOSED; a resolved ticket can be reopened. Severity derives the SLA and badge tone. Mongoose stores raw enum values from .rawValues, while hydrateTicket() re-parses them before they enter the branded domain. A retired v1 status fails closed.

The internal triage vocabulary extends public severities with CRITICAL; publicTriageSeveritySchema omits that internal-only member for external responses. Ticket transitions use optimistic versions, so a stale agent sees a conflict rather than overwriting another agent’s update.

Validate: pnpm --dir examples/nestjs test; pnpm --dir examples/nestjs test:types; pnpm --dir examples/nestjs build
