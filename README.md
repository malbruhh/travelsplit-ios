# TravelSplit iOS — Group & Individual Spending Tracker ✈️

> An enterprise-grade, iOS-focused mobile application for travel group expense splitting, deep individual spending analysis, itemized receipt breakdown, and debt minimization.

---

## 🌟 Architecture & Features

1. **Dual Perspective (Group Balance vs. Individual Consumption)**:
   - **Group Settlement Lens**: "Who owes whom how much?"
   - **Individual Consumption Lens**: "How much did *I personally consume* on this trip?" (True personal expenditure broken down by Food, Lodging, Transit, Activities, Shopping, Groceries, Emergency).
2. **5-in-1 Splitting Engine**:
   - **Equal**, **Exact Amounts**, **Percentages**, **Weighted Shares**, and **Itemized Receipt Breakdown** with proportional tax and tip distribution.
3. **Smart Debt Minimization**:
   - Reduces $N$-way debts into minimal direct transfers via a greedy bipartite graph balancing algorithm.
4. **Role-Based Access Control (RBAC)**:
   - **Trip Owner**: Full administration (manage trip settings, members, modify any expense, delete trip).
   - **Editor / Member**: Add expenses, edit own expenses, record settlements.
   - **Viewer / Guest**: Read-only spending & balance insights.
5. **Convex Real-Time Database**:
   - Serverless reactive tables (`convex/schema.ts`, `convex/trips.ts`, `convex/expenses.ts`, `convex/settlements.ts`) with live WebSocket push updates.
6. **Local-First Offline Fallback**:
   - 100% offline persistence using Dexie.js (IndexedDB) with immutable audit logs.
7. **CI/CD Pipeline with GitHub Actions & Vercel**:
   - Quality gate running Vitest math tests, strict TypeScript checks, and automated Vercel deployment.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start local backend server (port 5000)
npm run server

# 3. Start local Vite frontend (port 5173, in another terminal)
npm run dev

# 4. Run test suite
npx vitest run
```

The app will be available at `http://localhost:5173`.

---

## ⚙️ Environment Separation

The app supports separate environments out of the box:

- **Local Dev (`npm run dev`)**: Reads [`.env.development`](file:///.env.development) &rarr; `http://localhost:5000/api`
- **Production Build (`npm run build`)**: Reads [`.env.production`](file:///.env.production) &rarr; `/api` or Cloud URL
- **Template Reference**: [`.env.example`](file:///.env.example)

---

## 🚀 Continuous Deployment (GitHub Actions ➔ Vercel)

### Required GitHub Repository Secrets
Add these secrets in **GitHub Repo &rarr; Settings &rarr; Secrets & Variables &rarr; Actions**:
- `VERCEL_TOKEN`: Your Vercel API Token (from [vercel.com/account/tokens](https://vercel.com/account/tokens))
- `VERCEL_ORG_ID`: Your Vercel Team / Account ID (from `.vercel/project.json` or Project Settings)
- `VERCEL_PROJECT_ID`: Your Vercel Project ID

### Deployment Branches:
- **Push to `main`**: Automatically deploys the verified production build to your live production domain.
- **Push to `dev` or Pull Requests**: Automatically creates a Vercel **Preview Deployment** for testing before merging.

---

## 🐳 Optional Self-Hosted / Offline Docker

```bash
# Run both Backend API and Frontend with 1 command:
docker compose up --build
```
Access at `http://localhost:3000`.
