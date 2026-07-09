---
name: audit-codebase
description: Full-repo audit for this Next.js + NestJS/Prisma monorepo — finds and fixes unused imports/dead code, flags risky changes that could break a feature, surfaces performance issues, checks architecture/edge cases, reviews backend security, checks frontend/backend design patterns, and reviews folder structure. Use when the user asks to audit, review, or clean up the codebase, check for unused code, review architecture or security, or asks "what can be improved" across apps/web or apps/backend.
---

# Codebase Audit

Audits `apps/web` (Next.js App Router) and `apps/backend` (NestJS + Prisma) in this
pnpm/Turborepo monorepo. Produces a single categorized report; only auto-fixes items
that are safe by construction (unused imports/vars, obviously dead code). Everything
else is a proposal the user approves before you touch it.

## Scope first

Ask (or infer from the request) which mode applies, don't assume:

- **Diff mode** — audit only files touched vs `main`/`develop` (`git diff --stat origin/main...HEAD`).
  Default when the user says "review my changes" or a PR is open.
- **Full mode** — audit `apps/web` and `apps/backend` end to end. Default when the user says
  "audit the codebase" with no qualifier.
- **Targeted mode** — user names an app, feature folder, or concern (e.g. "just check backend
  security", "check the files feature for unused imports").

Don't silently run full mode on a monorepo this size if the user only asked about one concern —
confirm scope if it's ambiguous and would take long.

## Workflow

1. **Automated pass** (cheap, do first, ground everything else in real output — not guesses):

   ```bash
   pnpm turbo run lint          # eslint across all workspaces (or --filter=web / --filter=backend)
   pnpm turbo run check-types   # tsc --noEmit across all workspaces
   ```

   Both are already wired as turbo tasks (`turbo.json`). Unused imports/vars surface here if
   `@typescript-eslint/no-unused-vars` or `eslint-plugin-unused-imports` is active in
   `packages/eslint-config`; if not, grep for obviously dead exports/imports manually — don't
   assume the linter covers it.

2. **Delegate the 8 concern areas** below. For anything beyond a quick single-file check, use
   the `Agent` tool (`subagent_type: Explore` for pure discovery, `general-purpose` for
   discovery + judgment) so each concern gets a focused pass instead of one shallow linear read.
   Independent concerns (e.g. security review vs folder-structure review) can run in parallel.

3. **Report** using the structure in "Output format" below. Group by severity, not by concern —
   a Critical security gap matters more than every Low finding combined.

4. **Fix, gated by risk**:
   - Unused imports/vars/dead code with zero behavioral surface → fix directly, then run the
     automated pass again to confirm nothing broke.
   - Anything that changes runtime behavior, an API contract, a DB schema, or auth/guard logic →
     propose the fix and wait for explicit approval before editing. This is "risky" per the
     project's own safety rules — don't self-authorize it because it was "found during an audit."

## The 8 concern areas

### 1. Unused imports / dead code

- `pnpm turbo run lint` output + manual grep for exports with zero importers
  (`grep -rn "export (const|function|class) X" apps/` then check reference count).
- Check `apps/backend/src/**` for orphaned providers still listed in a module's `providers`/`exports`
  array after their last usage was removed — NestJS won't error on this, it just bloats the DI graph.
- Check `apps/web/components`, `features/*`, `packages/ui`, `packages/ui-design` for components
  exported but never imported anywhere (barrel `index.ts` files hide this — check the barrel's
  re-export against actual consumers, not just against the file that defines it).
- Fix directly (safe by construction) — but don't delete a DTO/type just because it's unused in
  `apps/web` if it's also consumed by `apps/backend` (or vice versa) via a shared package.

### 2. Risky changes / feature-breaking issues

- Diff mode: does the change alter a Prisma model without a corresponding migration
  (`apps/backend/prisma/migrations/`), a DTO shape consumed by the frontend, a NestJS guard's
  logic (`apps/backend/src/modules/core/auth/guards/`), or the `middleware.ts` auth-gate logic
  in `apps/web`?
- Full mode: look for places that assume a happy path with no fallback — an unguarded
  `JSON.parse`, an array index access with no bounds check, a Prisma `findFirstOrThrow`/`update`
  with no `try/catch` at the controller boundary (NestJS will 500 unhelpfully instead of a clean
  4xx), a BullMQ job handler with no failure/retry handling, an unawaited Promise in a request
  path (silently swallowed rejection).
- Flag, don't auto-fix — these require the user's judgment on intended behavior.

### 3. Performance

- **Backend**: N+1 Prisma queries (a `.map()` over results each doing its own `prisma.x.findUnique`
  instead of `include`/`select` or a single batched query), missing `select` on large models,
  unbounded `findMany` with no `take`/pagination, synchronous work blocking the event loop (e.g.
  heavy sync loops in a request handler instead of a BullMQ job), LangChain/Qdrant calls made
  serially where they could run via `Promise.all`.
- **Frontend**: missing memoization on expensive derived values or components that re-render on
  every keystroke, TanStack Query keys that cause redundant refetches (unstable query key objects,
  missing `staleTime`), large client bundles from importing a whole library instead of a subpath,
  Next.js images not using `next/image`, waterfalled `await` calls that could be parallel.
- Only flag what's measurably worse than the obvious alternative — don't invent micro-optimizations
  with no real impact (e.g. don't flag `useMemo` for a trivial computation).

### 4. Architecture correctness & edge cases

- Does each NestJS module have a single clear responsibility, or has `modules/core` accumulated
  cross-cutting concerns that belong in `common/`?
- Are DTOs (`class-validator`/`class-transformer`) validating everything the global
  `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true`) expects, or is there a
  controller accepting a raw untyped body?
- Edge cases: empty arrays/null from Prisma queries, Cloudinary upload failures, expired/missing
  JWTs, concurrent writes to the same row, file-upload size/type limits actually enforced server-side
  (not just client-side in `apps/web/features/files`).
- Frontend: does `contexts/`, `hooks/`, and `lib/react-query/` correctly separate server state
  (TanStack Query) from client/UI state, or is there duplicated state living in both a context and
  a query cache?

### 5. Backend security

Check against NestJS/Prisma standard patterns, not generic OWASP boilerplate:

- **Auth**: every controller/route that should be protected actually has a guard
  (`apps/backend/src/modules/core/auth/guards/`) — a new endpoint added without one is the most
  common regression. Check `@Public()`-style decorators aren't applied to something that shouldn't be.
- **CORS**: `CorsConfigService` (`apps/backend/src/config/cors.config.ts`) — confirm it's not
  wildcard-open (`origin: '*'`) alongside `credentials: true`.
- **Secrets/env**: `apps/backend/src/config/env.config.ts` — no secrets committed, no secret
  logged (check `LoggingInterceptor`), JWT secret has real entropy and isn't a fallback default.
- **Input validation**: global `ValidationPipe` is applied everywhere — check no controller
  bypasses it with `@Body() body: any`.
- **Prisma**: no raw SQL string-concatenation (`prisma.$queryRawUnsafe` with interpolated input);
  `$queryRaw` should use parameterized tagged templates only.
- **Rate limiting**: `ThrottlerModule` limits (`env.config.THROTTLE_TTL`/`THROTTLE_LIMIT`) are
  sane for auth endpoints specifically (login/signup often need tighter limits than the global default).
- **File uploads**: Cloudinary upload path validates file type/size before upload, not after.
- **Error responses**: `HttpExceptionFilter` doesn't leak stack traces or internal error details
  in production responses.
- Cite the standard NestJS/Prisma pattern when suggesting a fix (e.g. "use a route-level
  `@UseGuards(JwtAuthGuard)` matching the pattern in `auth/guards/`" rather than inventing a new
  auth mechanism).

### 6. Design patterns (frontend & backend)

- **Backend**: consistent controller → service → repository(Prisma) layering — flag any
  controller doing Prisma calls directly instead of delegating to a service; DI used correctly
  (constructor injection, not manual instantiation); DTOs used for both input and response
  shaping instead of leaking Prisma models straight to the client.
- **Frontend**: consistent use of the `features/<domain>` structure (`features/ai`,
  `features/auth`, `features/files`, `features/jobs`, `features/workspaces`) — flag logic that
  belongs in a feature folder but lives loose in `app/` or `components/`; server components vs
  client components used appropriately (`"use client"` only where interactivity/hooks require it);
  shared UI coming from `packages/ui`/`packages/ui-design` rather than duplicated locally.
- Flag inconsistency between similarly-shaped features more than any single "wrong" pattern —
  the goal is one coherent convention per concern, not textbook purity.

### 7. Folder structure

- Compare `apps/backend/src/modules/core/*` and `apps/web/features/*` against each other and
  against their own internal consistency (does every feature have the same subfolder shape —
  `dto/`, `guards/` for backend; consistent co-location for frontend features?).
- Flag: files in the wrong app (frontend-only type defined in `apps/backend`), a growing
  `modules/core` that should split into separate top-level modules, orphaned folders left after
  a refactor, inconsistent naming (`kebab-case` vs `camelCase` folders) that isn't caught by lint.
- Suggestions here are lower urgency — call them out separately from Critical/High findings.

### 8. Overall improvements

Catch-all for anything not covered above but worth flagging: missing tests around risky logic,
stale/misleading comments, TODOs that reference finished work, config duplicated between
`apps/web` and `apps/backend` that could live in a shared package, `.env.example` drift vs
`env.config.ts`'s actual expected keys.

## Output format

```
# Codebase Audit — {scope: diff|full|targeted}

## Critical (breaks something now, or is exploitable)
- **[security|correctness] apps/backend/.../file.ts:42** — <finding>
  Fix: <concrete fix, cite the existing pattern to follow>

## High
...

## Medium
...

## Low / Nice-to-have
...

## Auto-fixed (unused imports / dead code)
- apps/web/... — removed unused import `X`
```

Every finding needs a file:line and a concrete fix, not a vague "consider reviewing X." If a
finding is speculative (you didn't verify it, just suspect it), say so explicitly rather than
stating it as fact.

## After fixing

Re-run `pnpm turbo run lint` and `pnpm turbo run check-types` on whatever you touched to confirm
the fix didn't introduce a new issue, before reporting the task done.
