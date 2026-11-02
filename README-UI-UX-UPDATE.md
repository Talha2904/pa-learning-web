# UI/UX update — Project Accountants Learning Platform

This source update applies the visual direction from `Project_Accountants_Learning_Platform_V13_Sorting_Improved_Headers.html` to the React/Vite frontend while preserving the existing React routes and API behavior.

## Updated areas
- Navy gradient sidebar with refined navigation, active state, and mobile header.
- Pale blue workspace background, sticky translucent page header, clearer title hierarchy.
- Rounded white/glass-inspired panels and stat cards with soft shadows.
- Refined responsive table styling with zebra rows and hover states.
- Table search, sortable headers, rows-per-page selection, and pagination controls in the shared `DataTable` component.
- Improved field focus styling, buttons, dialogs, and sign-in layout.
- Responsive behavior for narrow screens and reduced-motion preferences.

## Run locally
Requires Node.js 20.19+.

1. Install dependencies: `npm ci`
2. Configure `.env.local` using `.env.example` (or use the demo setup described in `README.md`).
3. Start the frontend: `npm run dev` or `npm run dev:demo`.

The original `.env`, `node_modules`, `.git`, and build outputs are intentionally not included in this ZIP. Do not share secrets from environment files.

## Validation note
A build was attempted in the provided execution environment, but dependencies were not fully present (`vite/client`, `@types/node`, and `@testing-library/jest-dom` type definitions were missing). Installing dependencies timed out, so a full production build and live-browser verification could not be completed here. Source changes are included for review and should be built after `npm ci` in an environment with package registry access.
