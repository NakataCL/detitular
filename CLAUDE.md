# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Football academy management PWA (Spanish-language UI). Handles events, player registrations, multimedia experiences gallery, user profiles, and membership plans. Built with React + Firebase, deployed as a Progressive Web App.

## Commands

- `npm run dev` — Start dev server (http://localhost:5173)
- `npm run build` — Production build to `dist/`
- `npm run lint` — ESLint check
- `npm run preview` — Preview production build
- `firebase deploy --only firestore:rules,storage` — Deploy security rules
- `firebase deploy --only hosting` — Deploy to Firebase Hosting

No test framework is configured.

## Architecture

**Stack:** React 19 + Vite 7 + Tailwind CSS 4 + Firebase (Auth, Firestore, Storage) + TanStack Query

**Provider hierarchy** (in `App.jsx`):
`QueryClientProvider` → `AuthProvider` → `BrowserRouter` → `Routes`

**Key layers:**

- **`src/firebase/`** — Service layer wrapping Firebase SDK. Separated into `config.js`, `auth.js`, `firestore.js`, `storage.js`. All Firestore CRUD lives in `firestore.js`.
- **`src/context/AuthContext.jsx`** — Provides `useAuth()` hook with `user`, `userData`, `isAdmin`, `isPlayer`, `isAuthenticated`, `login`, `logout`, `refreshUserData`. Google OAuth with redirect handling for mobile.
- **`src/hooks/`** — Custom hooks wrapping TanStack Query for data fetching (`useEvents`, `usePlayer`, `useRegistrations`, `useExperiences`, `useStats`, `usePWA`).
- **`src/components/layout/ProtectedRoute`** — Route guard supporting `requireAuth` and `requireAdmin` props.
- **`src/utils/constants.js`** — App-wide constants (positions, plan types, categories).
- **`src/utils/helpers.js`** — Date formatting (using `date-fns`), validation, and utility functions.

**Routing:**
- Public: `/`, `/eventos`, `/eventos/:id`, `/experiencias`
- Authenticated: `/registros`, `/perfil`
- Admin: `/admin`, `/admin/eventos`, `/admin/usuarios`

**Firestore collections:** `users`, `events`, `registrations`, `experiences`

**Roles:** `admin` (configured via `VITE_ADMIN_EMAIL`) and `jugador` (default for all other users).

## Key Patterns

- All Firebase operations go through `src/firebase/firestore.js` — never call Firestore directly from components.
- Server state is managed with TanStack Query (5-minute stale time, single retry). Custom hooks in `src/hooks/` wrap query/mutation logic.
- Real-time subscriptions (`onSnapshot`) are available in `firestore.js` for events and registrations.
- Event slot management uses Firestore `increment()` for atomic counter updates.
- UI components in `src/components/ui/` (Button, Card, Input, Modal, etc.) are the base building blocks.
- Animations use Framer Motion. Icons use Lucide React. Toasts use react-hot-toast.
- PWA caching strategies are configured in `vite.config.js` (CacheFirst for images/fonts, NetworkFirst for Firebase APIs).

## Environment

Requires a `.env` file based on `.env.example` with Firebase credentials and `VITE_ADMIN_EMAIL`. All env vars are prefixed with `VITE_`.
