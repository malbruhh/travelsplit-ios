# TravelSplit iOS — Group & Individual Spending Tracker ✈️

> An enterprise-grade, iOS-focused mobile application for travel group expense splitting, deep individual spending analysis, itemized receipt breakdown, and debt minimization.

---

## 🌟 Key Features

1. **Dual Perspective (Group Balance vs. Individual Consumption)**:
   - **Group Settlement Lens**: "Who owes whom how much?"
   - **Individual Consumption Lens**: "How much did *I personally consume* on this trip?" (True personal expenditure broken down by Food, Lodging, Transit, Activities, Shopping, Groceries, Emergency).
2. **5-in-1 Splitting Engine**:
   - **Equal**: Split evenly among all or selected subset.
   - **Exact Amounts**: Specific currency values assigned per person.
   - **Percentages**: Percentage-based distribution (must equal 100%).
   - **Weighted Shares**: Weight-based splits (e.g. 1 share, 2 shares, 0.5 shares).
   - **Itemized Receipt Breakdown**: Assign dish/item lines to specific people with automatic proportional distribution of taxes, tips, and service fees.
3. **Smart Debt Minimization**:
   - Reduces $N$-way debts into minimal direct transactions using a greedy bipartite graph balancing algorithm.
4. **Role-Based Access Control (RBAC)**:
   - **Trip Owner**: Full administrative privileges (manage trip settings, members, modify any expense, delete trip).
   - **Editor / Member**: Add expenses, edit own expenses, record settlements.
   - **Viewer / Guest**: Read-only spending & balance insights.
5. **iOS Human Interface Guidelines (HIG)**:
   - Authentic iPhone 16 Pro viewport frame with dynamic island and desktop/fullscreen toggle.
   - Frosted blur navigation headers and bottom tab bar.
   - iOS bottom sheets (Vaul drawers) with spring drag physics.
   - Tactile web haptic feedback on interactions.
6. **Local-First & Offline Travel Ready**:
   - 100% offline persistence using Dexie.js (IndexedDB) with immutable enterprise audit trails.
7. **Enterprise Containerization**:
   - Multi-stage Dockerfile with Gzip compression serving compressed static assets (~20MB total footprint).

---

## 🚀 Quick Start (Local Development)

```bash
# Navigate to project directory
cd travelsplit-ios

# Install dependencies
npm install

# Start local Vite dev server
npm run dev

# Run unit tests
npm test
```

The app will be available at `http://localhost:5173`.

---

## 🐳 Docker Deployment

### 1. Build and Run with Docker Compose
```bash
docker compose up --build
```

Access the production compressed app at `http://localhost:3000`.

### 2. Standalone Docker Build
```bash
docker build -t travelsplit-ios .
docker run -p 3000:80 travelsplit-ios
```

---

## 🧪 Testing Suite

Automated unit tests with Vitest cover:
- Mathematical accuracy for equal splits with uneven cents (e.g. $100 across 3 people = $33.34, $33.33, $33.33).
- Proportional distribution of taxes and tips in itemized receipts.
- Circular debt elimination ($A \to B \to C \to A = \$0$).
- Total group expenses $\equiv \sum \text{Individual Consumed}$.
- RBAC permission guards for Owner, Editor, and Viewer roles.

Run tests with:
```bash
npx vitest run
```
