# Shift Planner Web

Production-quality **employee shift planning frontend** built with Next.js 15 (App Router), Tailwind CSS v4, and React Query.  
Portfolio project — demonstrating modern React patterns, drag & drop scheduling, role-based UI, and print-ready reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 (`@theme` directive) |
| State | @tanstack/react-query v5 |
| Forms | react-hook-form + zod |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| HTTP | axios |
| Icons | lucide-react |
| Date/Time | date-fns + date-fns-tz |
| Auth | JWT (sessionStorage) + Refresh Token (httpOnly cookie) |

---

## Features

- **Role-based access**: Admin / Manager / Employee views
- **Weekly schedule grid** with drag & drop to move shifts between days
- **Shift management**: Create, edit, publish, cancel, copy entire weeks
- **Overnight shift support**: Shifts crossing midnight handled correctly
- **Availability blocks**: Employees mark unavailability (recurring or date-range)
- **Reports**: Weekly hours summary with cost calculation
- **Print view**: A4-optimized printable schedule
- **Dark mode**: Via CSS class toggle
- **Responsive sidebar**: Collapsible navigation

---

## Getting Started

### Prerequisites

- Node.js 20+
- [shift-planner-api](../shift-planner-api) running on port 3001

### 1. Install

```bash
cd shift-planner-web
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

`.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Start Dev Server

```bash
npm run dev
```

App is available at **http://localhost:3000**

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@shiftplanner.com | Admin1234! |
| Manager | manager@shiftplanner.com | Manager1234! |
| Employee | ali@shiftplanner.com | Employee1234! |

*Seed the backend database first to activate these accounts.*

---

## Pages

| Route | Description | Access |
|---|---|---|
| `/login` | Login page | Public |
| `/schedule` | Weekly shift grid with DnD | Manager+ |
| `/schedule/print` | Print-ready A4 schedule | Manager+ |
| `/employees` | Employee CRUD | Admin/Manager |
| `/availability` | Availability block management | All roles |
| `/my-shifts` | Personal shift view + acknowledge | Employee |
| `/reports` | Hours & cost reports | Manager+ |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/          # Login page
│   └── (dashboard)/
│       ├── layout.tsx       # Auth guard + Sidebar + Navbar
│       ├── schedule/        # Weekly grid + print view
│       ├── employees/       # Employee management
│       ├── availability/    # Availability blocks
│       ├── my-shifts/       # Employee personal view
│       └── reports/         # Reporting
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Navbar.tsx
│   ├── schedule/
│   │   ├── WeeklyGrid.tsx   # Main DnD schedule grid
│   │   ├── ShiftCard.tsx    # Draggable shift card
│   │   ├── ShiftModal.tsx   # Create/edit shift form
│   │   ├── WeekPicker.tsx   # Week navigation
│   │   └── CopyWeekModal.tsx
│   └── ui/
│       ├── button.tsx       # CVA variants
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── badge.tsx        # Status badges
│       ├── dialog.tsx       # Modal + ConfirmDialog
│       ├── toast.tsx        # Toast notification system
│       └── spinner.tsx
├── hooks/
│   ├── useAuth.tsx          # Auth context + user state
│   ├── useShifts.ts         # Shift CRUD mutations
│   ├── useEmployees.ts      # Employee queries
│   ├── useAvailability.ts   # Availability mutations
│   └── useReports.ts        # Report queries
└── types/
    └── index.ts             # Shared TypeScript interfaces
```

---

## Shift Status Flow

```
DRAFT → PUBLISHED → ACKNOWLEDGED
                 ↘ CANCELLED
```

- **DRAFT**: Created but not visible to employees
- **PUBLISHED**: Visible to employees, awaiting acknowledgment
- **ACKNOWLEDGED**: Employee confirmed the shift
- **CANCELLED**: Shift cancelled

---

## Deployment (Vercel)

1. Push repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
4. Deploy

---

## Key Design Decisions

- **Tailwind CSS v4** — Uses the new `@theme` CSS directive instead of `tailwind.config.js` for theming
- **React Query** — All server state (no useState for remote data), optimistic updates where applicable
- **Date strings** — Week dates are passed as `YYYY-MM-DD` strings throughout; timezone conversion happens only at display time
- **DnD Kit** — Used over react-beautiful-dnd for React 18+ compatibility and better TypeScript support
- **No global store** — Auth context + React Query covers all state needs without Redux/Zustand
