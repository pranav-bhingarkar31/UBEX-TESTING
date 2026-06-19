# UbEx Platform Navigation & Layout Map Audit
---

This document traces user experience routing, mapping components to their corresponding virtual states, validating physical existences, and confirming user reachability metrics prior to deployment.

## 1. COMPREHENSIVE NAVIGATION DISCOVERY LEDGER

| Navigation Item | Virtual Router / Hash Key | UI Component File | Exists in Codebase? | Reachable to User? | Trigger Method / Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Home** | `/` (Blank or Hashless) | `src/App.tsx` (Hero Section) | **Yes** | **Yes** | Click Upper Logo or Header Home Links |
| **Stays** | `activeView === "stays"` | `src/components/StaysPage.tsx` | **Yes** | **Yes** | Header Navigation Bar "Stays" |
| **Experiences**| `activeView === "experiences"` | `src/components/ExperiencesPage.tsx` | **Yes** | **Yes** | Header Navigation Bar "Experiences" |
| **Checkout** | `activeView === "checkout"` | `src/components/CheckoutPage.tsx` | **Yes** | **Yes** | Floating Cart Overlay or Navigation Click |
| **Passport** | `activeView === "passport"` | `src/components/PassportDashboard.tsx`| **Yes** | **Yes** | Guest Profile Menu dropdown or Dashboard clicks |
| **Admin OS** | `#admin` or `?admin=true` | `src/components/AdminOSDashboard.tsx` | **Yes** | **Yes** | Append `#admin` to URL + click 📊 CMS button in Header |
| **Profile** | Unified User Dropdown | `src/App.tsx` User Card | **Yes** | **Yes** | Click authenticated User bubble |
| **Blog** | `activeView === "blog"` | `src/components/BlogPage.tsx` | **Yes** | **Yes** | Footer link or Mega-Menu link |
| **About Us** | `activeView === "about"` | `src/components/AboutUsPage.tsx` | **Yes** | **Yes** | Footer link or Mega-Menu link |
| **Contact** | `activeView === "contact"` | `src/components/ContactPage.tsx` | **Yes** | **Yes** | Footer link or Mega-Menu link |

---

## 2. ADVANCED INTERACTIVE LAYOUT REGISTRY

In addition to primary links, secondary modular pages are verified:

*   **Careers Portal (`activeView === "careers"`)**:
    *   *Component*: `src/components/CareersPage.tsx`
    *   *Audit*: Verified. Fully reachable via Footer Mega-Menu items. Registers corporate applicants.
*   **Partner/Host Portal (`activeView === "partner"`)**:
    *   *Component*: `src/components/PartnerPage.tsx`
    *   *Audit*: Verified. Reachable via Footer Mega-Menu links. Collects host applications.
*   **FAQs Portal (`activeView === "faqs"`)**:
    *   *Component*: `src/components/FaqsPage.tsx`
    *   *Audit*: Verified. Fully reachable via Footer menu links.
*   **Guest Stories / Reviews (`activeView === "share-your-story"`)**:
    *   *Component*: `src/components/ShareYourStoryPage.tsx`
    *   *Audit*: Verified. Fully reachable for authenticated users wishing to publish travel blogs.

---

## 3. FLOW CONTROLS & COMPACT RE-ROUTING FUNCTIONS
Re-routing behavior is centralized through the `switchToTab` hook callback parameter inside dynamic screens, facilitating cross-page flows:
```typescript
const switchToTab = (tab: string) => {
  setActiveView(tab);
  window.scrollTo({ top: 0, behavior: "smooth" });
};
```
*   **Post-Add Cart rerouting**: Adding checking details dynamically transitions the screen from `stays` to `checkout` for checkout pipeline consistency.
*   **MFA Log-out resetting**: Upon clicking administrative logout, the system terminates backend sessions and securely sets local `activeView` variables back to `'home'` to prevent unauthorized cache leaks.
