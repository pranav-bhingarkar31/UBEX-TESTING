# UbEx Platform - Dead/Broken Route Discovery & Import Integrity Audit
---

This document summarizes the dead-code, routing discrepancies, duplications, and unreachable UI component check applied to the entire **UbEx platform** codebase.

## 1. COMPONENT INTEGRITY AUDIT MATRIX

Every component file listed in `/src/components` has been audited against active imports and rendering states inside the main router context of `src/App.tsx`.

| Physical Component File | Imported? | Active Render Case / Match Condition | Reachable? | Issue Detected / Resolution |
| :--- | :--- | :--- | :--- | :--- |
| `src/components/StaysPage.tsx` | **Yes** | `activeView === "stays"` | **Yes** | None. Fully active. |
| `src/components/ExperiencesPage.tsx` | **Yes** | `activeView === "experiences"` | **Yes** | None. Fully active. |
| `src/components/CheckoutPage.tsx` | **Yes** | `activeView === "checkout"` | **Yes** | None. Fully active. |
| `src/components/CommunityPage.tsx` | **Yes** | `activeView === "community"` | **Yes** | None. Fully active. |
| `src/components/CorporatePage.tsx` | **Yes** | `activeView === "corporate"` | **Yes** | None. Fully active. |
| `src/components/PassportDashboard.tsx`| **Yes** | `activeView === "passport"` | **Yes** | None. Fully active. |
| `src/components/ShareYourStoryPage.tsx`| **Yes** | `activeView === "share-your-story"` | **Yes** | None. Fully active. |
| `src/components/AboutUsPage.tsx` | **Yes** | `activeView === "about"` | **Yes** | None. Fully active. |
| `src/components/BlogPage.tsx` | **Yes** | `activeView === "blog"` | **Yes** | None. Fully active. |
| `src/components/CareersPage.tsx` | **Yes** | `activeView === "careers"` | **Yes** | None. Fully active. |
| `src/components/PartnerPage.tsx` | **Yes** | `activeView === "partner"` | **Yes** | None. Fully active. |
| `src/components/FaqsPage.tsx` | **Yes** | `activeView === "faqs"` | **Yes** | None. Fully active. |
| `src/components/ContactPage.tsx` | **Yes** | `activeView === "contact"` | **Yes** | None. Fully active. |
| `src/components/AdminOSDashboard.tsx` | **Yes** | `showAdminDashboard === true` overlay | **Yes** | None. Fully active. |
| `src/components/UbexDatePicker.tsx` | **Yes** | Integrated custom date picker sub-widget | **Yes** | None. Fully active. |
| `src/components/ExplorerPassportWidget.tsx` | **Yes** | Integrated sub-component in home / profile pages | **Yes** | None. Fully active. |
| `src/components/UbexExplorerPassportSection.tsx` | **Yes** | Integrated sub-component inside widgets folders | **Yes** | None. Fully active. |

---

## 2. COMPACT ROUTE INTEGRITY FINDINGS

### A. Unreachable / Unrouted Components
*   **Result**: `0` components discovered in dead state. Every single `.tsx` component generated inside `/src/components` is dynamically mounted and has active logic hooks switching its rendering within `src/App.tsx`.

### B. Navigation Links Pointing to Missing Pages
*   **Result**: `0` broken links. Footer anchor navigation items and Header navigation anchors map strictly to defined conditional `activeViewChoice` hooks. Hash links are verified and successfully tied to proper DOM containers (`#accommodation-section`, `#experience-grid`, etc.).

### C. Duplicate Routes/Toggles
*   **Result**: `0` duplications of routes. Render conditions exist as a single flat `if-else` block inside the parent React component return layout, which mathematically removes any possibility of multi-route match collisions or overlapping template states.

### D. Broken Route Imports in Server or Client compiles
*   **Result**: `0` broken imports. Checked by continuous running of standard linter checks. All module files compile smoothly to a unified single executable bundle without encountering unresolved dependency issues.
