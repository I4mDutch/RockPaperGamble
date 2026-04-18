# Milestone 1: Scaffolding & Infrastructure

**Status:** 🏗️ Planning
**Task Slug:** `rpg-milestone-1`

## Goal
Establish the monorepo structure, initialize the frontend and server projects, and set up the foundation for Supabase Auth and PartyKit communication.

## Infrastructure Requirements (Action Needed from User)
To complete the auth and server setup, I will need the following values from you:

### 1. Supabase
- **VITE_SUPABASE_URL**: [REDACTED]
- **VITE_SUPABASE_ANON_KEY**: [REDACTED]
- **SUPABASE_SERVICE_ROLE_KEY**: [REDACTED]

### 2. Discord (In Discord Developer Portal)
- **CLIENT_ID**: [REDACTED]
- **CLIENT_SECRET**: [REDACTED]
- **Redirect URI**: https://tgwfiqihfuwdpuwbzvmb.supabase.co/auth/v1/callback

### 3. PartyKit
- [done] Run `npx partykit login` in your terminal to authenticate your local environment.

---

## Task Breakdown

### Phase 1: Workspace Setup
- [ ] Initialize root `package.json` with NPM Workspaces (`packages/*`).
- [ ] Create `packages/shared` for cross-project TypeScript types.
- [ ] Initialize `packages/frontend` (Vite + React + TS + Tailwind CSS v4).
- [ ] Initialize `packages/server` (PartyKit).

### Phase 2: Core Dependencies & Boilerplate
- [ ] Install `@supabase/supabase-js`, `zustand`, `partysocket` in frontend.
- [ ] Set up basic folder structure for frontend (components, store, lib).
- [ ] Set up basic folder structure for server (handlers, logic).

### Phase 3: Auth & Connection Foundation
- [ ] Implement `supabase.ts` client initialization.
- [ ] Create `authStore.ts` in Zustand to manage sessions.
- [ ] Build a skeleton `LoginPage` with the Discord login trigger.
- [ ] Build a skeleton `PartyKit` handler that validates JWTs (placeholders until keys provided).

---

## Next Steps
1. Execute workspace initialization.
2. Scaffold individual packages.
3. Wait for User to provide API keys to finish Auth integration.
