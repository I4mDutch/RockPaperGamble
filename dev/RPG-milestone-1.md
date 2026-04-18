# Milestone 1: Scaffolding & Infrastructure

**Status:** 🏗️ Planning
**Task Slug:** `rpg-milestone-1`

## Goal
Establish the monorepo structure, initialize the frontend and server projects, and set up the foundation for Supabase Auth and PartyKit communication.

## Infrastructure Requirements (Action Needed from User)
To complete the auth and server setup, I will need the following values from you:

### 1. Supabase
- **VITE_SUPABASE_URL**: https://tgwfiqihfuwdpuwbzvmb.supabase.co
- **VITE_SUPABASE_ANON_KEY**: [REDACTED]
- **SUPABASE_SERVICE_ROLE_KEY**: [REDACTED]

### 2. Discord (In Discord Developer Portal)
- **CLIENT_ID**: 1495115600073199830
- **CLIENT_SECRET**: [REDACTED]
- **Redirect URI**: https://tgwfiqihfuwdpuwbzvmb.supabase.co/auth/v1/callback

### 3. PartyKit
- [done] Run `npx partykit login` in your terminal to authenticate your local environment.

---

## Task Breakdown

### Phase 1: Workspace Setup [DONE]
- [x] Initialize root `package.json` with NPM Workspaces (`packages/*`).
- [x] Create `packages/shared` for cross-project TypeScript types.
- [x] Initialize `packages/frontend` (Vite + React + TS + Tailwind CSS v4).
- [x] Initialize `packages/server` (PartyKit).

### Phase 2: Core Dependencies & Boilerplate [DONE]
- [x] Install `@supabase/supabase-js`, `zustand`, `partysocket` in frontend.
- [x] Set up basic folder structure for frontend (components, store, lib).
- [x] Set up basic folder structure for server (handlers, logic).

### Phase 3: Game Logic & Persistence [DONE]
- [x] Implement `supabase.ts` client initialization.
- [x] Create `authStore.ts` in Zustand to manage sessions.
- [x] Build Rock, Paper, Scissors server-side engine.
- [x] Integrate parimutuel betting and tie-breaking (Push).
- [x] Sync coins to Supabase `profiles` table.

### Phase 4: Deployment [IN PROGRESS]
- [x] Deploy Server to PartyKit.
- [x] Push code to GitHub.
- [ ] Finalize Cloudflare Pages Environment Variables.
- [ ] Run Supabase SQL migrations.

---

## Next Steps
1. Execute workspace initialization.
2. Scaffold individual packages.
3. Wait for User to provide API keys to finish Auth integration.
