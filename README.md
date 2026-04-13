# Stock Management System

A warehouse/distribution stock and sales management system built for Indian businesses. Manage products, customers, sales, inventory alerts, and staff — all with organization-level data isolation.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma 6, PostgreSQL
- **Auth**: NextAuth v4 (JWT strategy, credentials provider)
- **State**: TanStack Query, Zustand
- **Validation**: Zod v4
- **Notifications**: Sonner (toasts)

## Features

- **Products** — CRUD with SKU, barcode, cost/selling price, stock tracking, units (piece, box, kg, etc.)
- **Categories & Tax Rates** — Organize products, GST tax rates (0%, 5%, 12%, 18%, 28%)
- **Customers** — Manage customer details with GSTIN support
- **Sales** — Create sales with line items, automatic tax calculation, payment tracking (Cash, UPI, Bank Transfer, Cheque)
- **Inventory Alerts** — Low stock and out-of-stock notifications
- **Role-Based Access Control** — Users, Roles, Permissions (Admin, Staff, Viewer)
- **Multi-Tenancy** — Organization-scoped data isolation (planned)

## Project Structure

```
src/
├── app/              # Pages (App Router) + API routes
├── components/       # Shared UI components (shadcn/ui, layout)
├── services/         # Backend services (Prisma queries)
├── lib/              # Utilities, auth, db, constants, validations, locales
├── types/            # TypeScript type definitions
├── hooks/            # Custom React hooks
├── providers/        # React context providers
├── store/            # Zustand state stores
├── styles/           # CSS / Tailwind
└── middleware.ts     # Route protection
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. Clone the repository
   ```bash
   git clone <repo-url>
   cd stock
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment
   ```bash
   cp .env.example .env
   # Set DATABASE_URL to your PostgreSQL connection string
   ```

4. Run database migrations and seed
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Default Login

- **Email**: admin@stock.com
- **Password**: admin123

## License

Private
