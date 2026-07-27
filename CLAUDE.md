# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Football academy management PWA (Spanish-language UI). Handles events, player registrations, multimedia experiences gallery, user profiles, and membership plans. Built with React + Firebase, deployed as a Progressive Web App.

## Commands

- `npm run dev` — Start dev server (http://localhost:5173)
- `npm run build` — Production build to `dist/`
- `npm run lint` — ESLint check
- `npm run preview` — Preview production build
- `firebase deploy --only firestore:rules` — Deploy Firestore security rules
- `firebase deploy --only hosting` — Deploy to Firebase Hosting

No test framework is configured.

## Architecture

**Stack:** React 19 + Vite 7 + Tailwind CSS 4 + Firebase (Auth, Firestore) + Cloudinary (image uploads) + TanStack Query

**Provider hierarchy** (in `App.jsx`):
`QueryClientProvider` → `AuthProvider` → `BrowserRouter` → `Routes`

**Key layers:**

- **`src/firebase/`** — Service layer wrapping Firebase SDK. Separated into `config.js`, `auth.js`, `firestore.js`. All Firestore CRUD lives in `firestore.js`.
- **`src/services/cloudinary.js`** — Image upload service (replaces Firebase Storage). Exposes `uploadProfileImage`, `uploadExperienceImage`, `deleteFile` (no-op on client; orphans cleaned via Cloudinary dashboard). Uses unsigned upload preset.
- **`src/context/AuthContext.jsx`** — Provides `useAuth()` hook with `user`, `userData`, `isAdmin`, `isPlayer`, `isAuthenticated`, `needsOnboarding`, `login`, `loginWithPhone`, `logout`, `refreshUserData`.
- **`src/hooks/`** — Custom hooks wrapping TanStack Query for data fetching (`useEvents`, `usePlayer`, `useRegistrations`, `useExperiences`, `useStats`, `usePWA`).
- **`src/components/layout/ProtectedRoute`** — Route guard supporting `requireAuth` and `requireAdmin` props.
- **`src/utils/constants.js`** — App-wide constants (positions, plan types, categories).
- **`src/utils/helpers.js`** — Date formatting (using `date-fns`), validation, and utility functions.

**Routing:**
- Public: `/`, `/eventos`, `/eventos/:id`, `/experiencias`, `/login`
- Authenticated: `/registros`, `/perfil`, `/bienvenido` (onboarding)
- Admin: `/admin`, `/admin/eventos`, `/admin/usuarios`

**Firestore collections:** `users`, `events`, `registrations`, `experiences`

- `events` documents may include an optional `instructions` string. When present it surfaces in the post-registration confirmation sheet (see `RegistrationConfirmSheet`).
- `events.selectionMode` (`'orden' | 'entrenamiento'`, default `orden`) decides how the squad is picked. In `entrenamiento` mode registration has no cap (`maxSlots` = starting spots) and the admin publishes the squad from `EventAttendeesManager`, writing `selected` / `selectionRank` / `trainingCount` onto each registration. Ranking lives in `rankRegistrations` (`src/utils/helpers.js`), attendance counting in `getTrainingCounts` (window from `events.attendanceWindow`: `semana` = 7 days, `mes` = 30).

**Roles:** `admin` (configured via `VITE_ADMIN_EMAIL`) and `jugador` (default for all other users).

**Authentication:** two paths, both landing on a normal Firebase session.
- **Players — phone only, no SMS.** `signInWithPhone` (`src/firebase/auth.js`) normalizes the number to E.164 via `normalizePhone` (`src/utils/helpers.js`) and derives a synthetic credential (`56912345678@detitular.app` + a password derived from the number) against the Email/Password provider. The number *is* the credential — it is never verified, a deliberate trade-off to avoid the Blaze plan that SMS OTP requires. Upgrading to real `signInWithPhoneNumber` later needs no data migration: `users.telefono` already holds E.164.
- **Admin — Google OAuth**, unchanged (`signInWithPopup`, hidden behind the "Soy administrador" link on `/login`). `firestore.rules` still keys admin off `request.auth.token.email`, which only a Google session carries.
- New phone accounts have no `nombre`, so `ProtectedRoute` bounces them to `/bienvenido` until they fill in name + position.
- The `users` rules forbid self-writes to `role`/`plan`/`uid`, so an open phone login cannot escalate to admin.

## Key Patterns

- All Firebase operations go through `src/firebase/firestore.js` — never call Firestore directly from components.
- Server state is managed with TanStack Query (5-minute stale time, single retry). Custom hooks in `src/hooks/` wrap query/mutation logic.
- Real-time subscriptions (`onSnapshot`) are available in `firestore.js` for events and registrations.
- Event slot management uses Firestore `increment()` for atomic counter updates.
- UI components in `src/components/ui/` (Button, Card, Input, Modal, etc.) are the base building blocks.
- Animations use Framer Motion. Icons use Lucide React. Toasts use react-hot-toast.
- PWA caching strategies are configured in `vite.config.js` (CacheFirst for images/fonts, NetworkFirst for Firebase APIs).

## Environment

Requires a `.env` file based on `.env.example` with Firebase credentials, Cloudinary (`VITE_CLOUDINARY_CLOUD_NAME` + `VITE_CLOUDINARY_UPLOAD_PRESET`), and `VITE_ADMIN_EMAIL`. All env vars are prefixed with `VITE_`.
