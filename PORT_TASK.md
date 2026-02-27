# Adamrit.com — Full Port from Vite to Next.js 15

## Overview
Port ALL pages from the old Vite/React app at `/tmp/adamrit_23oct2025/` into this Next.js 15 app at `/tmp/adamrit.com/`.

## Current State
- Next.js 15 app with 7 basic pages (Dashboard, Patients, Patient Detail, IPD, OPD, Billing, Reports)
- Supabase backend: `tegvsgjhxrfddwpbgrzz.supabase.co`
- The old app uses React Router (SPA) + shadcn/ui + Tailwind
- The new app uses Next.js App Router + Tailwind (no shadcn yet)

## Source App Location
`/tmp/adamrit_23oct2025/` — Read ALL source files from here. Do NOT modify this directory.

## Target App Location  
`/tmp/adamrit.com/` — All changes go HERE.

## Supabase Config
```
URL: https://tegvsgjhxrfddwpbgrzz.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZ3ZzZ2poeHJmZGR3cGJncnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDU1NDIsImV4cCI6MjA4NzY4MTU0Mn0.WjKDFe5NueYvfenpqlRHbHQwuDSW9ogGILglCSxj0EM
```

## GitHub
- Repo: github.com/chatgptnotes/adamrit.com
- Push with: `git push origin main`

## Architecture Rules
1. Use **Next.js App Router** (`src/app/` directory)
2. Pages that need interactivity → use `'use client'` directive
3. Keep Supabase queries in the page files (server components where possible, client where needed)
4. Use Tailwind CSS for styling (same classes from old app)
5. Install shadcn/ui components as needed (`npx shadcn@latest add <component>`)
6. Reuse component logic from old app but adapt to Next.js patterns
7. Use `next/navigation` instead of `react-router-dom`
8. Dynamic routes: `[visitId]`, `[id]`, `[saleId]` etc use Next.js folder conventions

## Pages to Port (BATCH 1 — IPD & Patient Flow)

### Priority: IPD Core Flow
1. `/todays-ipd` → `src/app/todays-ipd/page.tsx` — Today's IPD Dashboard
2. `/currently-admitted` → `src/app/currently-admitted/page.tsx` — Currently Admitted Patients
3. `/discharged-patients` → `src/app/discharged-patients/page.tsx` — Discharged Patients
4. `/room-management` → `src/app/room-management/page.tsx` — Room/Ward Management
5. `/accommodation` → `src/app/accommodation/page.tsx` — Accommodation
6. `/admission-notes/[visitId]` → `src/app/admission-notes/[visitId]/page.tsx`
7. `/treatment-sheet` → `src/app/treatment-sheet/page.tsx`
8. `/discharge-summary-edit/[visitId]` → `src/app/discharge-summary-edit/[visitId]/page.tsx`
9. `/discharge-summary-print/[visitId]` → `src/app/discharge-summary-print/[visitId]/page.tsx`
10. `/ipd-discharge-summary/[visitId]` → `src/app/ipd-discharge-summary/[visitId]/page.tsx`

### Priority: Patient Management
11. `/patient-dashboard` → `src/app/patient-dashboard/page.tsx`
12. `/patient-overview` → `src/app/patient-overview/page.tsx`
13. `/patient-profile` → `src/app/patient-profile/page.tsx`
14. `/diagnoses` → `src/app/diagnoses/page.tsx`
15. `/complications` → `src/app/complications/page.tsx`
16. `/medications` (if page exists) → `src/app/medications/page.tsx`

### Priority: OPD
17. `/todays-opd` → `src/app/todays-opd/page.tsx`
18. `/opd-admission-notes/[visitId]` → `src/app/opd-admission-notes/[visitId]/page.tsx`

## Pages to Port (BATCH 2 — Billing & Finance)
19. `/final-bill/[visitId]` → `src/app/final-bill/[visitId]/page.tsx`
20. `/edit-final-bill/[visitId]` → `src/app/edit-final-bill/[visitId]/page.tsx`
21. `/invoice/[visitId]` → `src/app/invoice/[visitId]/page.tsx`
22. `/detailed-invoice/[visitId]` → `src/app/detailed-invoice/[visitId]/page.tsx`
23. `/discharge-invoice/[visitId]` → `src/app/discharge-invoice/[visitId]/page.tsx`
24. `/view-bill/[billId]` → `src/app/view-bill/[billId]/page.tsx`
25. `/old-bills` → `src/app/old-bills/page.tsx`
26. `/daywise-bills` → `src/app/daywise-bills/page.tsx`
27. `/accounting` → `src/app/accounting/page.tsx`
28. `/cash-book` → `src/app/cash-book/page.tsx`
29. `/day-book` → `src/app/day-book/page.tsx`
30. `/patient-ledger` → `src/app/patient-ledger/page.tsx`
31. `/ledger-statement` → `src/app/ledger-statement/page.tsx`
32. `/bill-submission` → `src/app/bill-submission/page.tsx`
33. `/bill-aging-statement` → `src/app/bill-aging-statement/page.tsx`
34. `/financial-summary` → `src/app/financial-summary/page.tsx`
35. `/advance-statement-report` → `src/app/advance-statement-report/page.tsx`
36. `/expected-payment-date-report` → `src/app/expected-payment-date-report/page.tsx`
37. `/corporate` → `src/app/corporate/page.tsx`
38. `/corporate-bulk-payments` → `src/app/corporate-bulk-payments/page.tsx`
39. `/it-transaction-register` → `src/app/it-transaction-register/page.tsx`

## Pages to Port (BATCH 3 — Clinical & Masters)
40. `/lab` → `src/app/lab/page.tsx`
41. `/radiology` → `src/app/radiology/page.tsx`
42. `/pharmacy` → `src/app/pharmacy/page.tsx` (+ sub-routes)
43. `/hope-surgeons` → `src/app/hope-surgeons/page.tsx`
44. `/hope-consultants` → `src/app/hope-consultants/page.tsx`
45. `/hope-anaesthetists` → `src/app/hope-anaesthetists/page.tsx`
46. `/ayushman-surgeons` → `src/app/ayushman-surgeons/page.tsx`
47. `/ayushman-consultants` → `src/app/ayushman-consultants/page.tsx`
48. `/ayushman-anaesthetists` → `src/app/ayushman-anaesthetists/page.tsx`
49. `/esic-surgeons` → `src/app/esic-surgeons/page.tsx`
50. `/cghs-surgery` → `src/app/cghs-surgery/page.tsx`
51. `/cghs-surgery-master` → `src/app/cghs-surgery-master/page.tsx`
52. `/clinical-services` → `src/app/clinical-services/page.tsx`
53. `/clinical-service-create` → `src/app/clinical-service-create/page.tsx`
54. `/mandatory-service` → `src/app/mandatory-service/page.tsx`
55. `/mandatory-service-create` → `src/app/mandatory-service-create/page.tsx`
56. `/implant-master` → `src/app/implant-master/page.tsx`
57. `/referees` → `src/app/referees/page.tsx`
58. `/users` → `src/app/users/page.tsx`

## Pages to Port (BATCH 4 — Print & Forms)
59. `/gate-pass/[visitId]` → `src/app/gate-pass/[visitId]/page.tsx`
60. `/no-deduction-letter/[visitId]` → `src/app/no-deduction-letter/[visitId]/page.tsx`
61. `/death-certificate/[visitId]` → `src/app/death-certificate/[visitId]/page.tsx`
62. `/physiotherapy-bill/[visitId]` → `src/app/physiotherapy-bill/[visitId]/page.tsx`
63. `/p2form/[visitId]` → `src/app/p2form/[visitId]/page.tsx`
64. `/pvi-form/[visitId]` → `src/app/pvi-form/[visitId]/page.tsx`
65. `/external-requisition` → `src/app/external-requisition/page.tsx`
66. `/external-requisition-create` → `src/app/external-requisition-create/page.tsx`

## Pages to Port (BATCH 5 — Reports & Marketing)
67. `/reports` (enhanced) → `src/app/reports/page.tsx`
68. `/marketing` → `src/app/marketing/page.tsx`
69. `/relationship-manager` → `src/app/relationship-manager/page.tsx`

## Sidebar
Update `src/components/Sidebar.tsx` to include ALL pages organized by category (copy structure from old `AppSidebar.tsx` at `/tmp/adamrit_23oct2025/src/components/AppSidebar.tsx`).

## Shared Components to Port
- AddPatientDialog, EditPatientDialog
- DischargeSummary, DischargeSummaryInterface
- BillSubmissionForm
- PatientCard, PatientTable
- ESICLetterGenerator
- SearchableDiagnosisSelect, SearchableMedicationSelect, SearchableLabSelect
- HospitalSelection (multi-hospital support)
- All pharmacy sub-components from `/tmp/adamrit_23oct2025/src/components/pharmacy/`

## Instructions
1. Start with BATCH 1 (IPD + Patient flow) — these are the most critical
2. For each page: read the old source, understand the Supabase queries, adapt to Next.js
3. Keep ALL business logic intact — every query, every filter, every calculation
4. After each batch, run `npx next build` to verify no errors
5. Commit after each batch with message like "feat: port Batch 1 - IPD & Patient flow"
6. Push to GitHub after each successful build

## DO NOT
- Do not modify the old app at `/tmp/adamrit_23oct2025/`
- Do not change the Supabase schema
- Do not skip any page — port ALL of them
- Do not simplify the logic — keep it exactly as the old app
