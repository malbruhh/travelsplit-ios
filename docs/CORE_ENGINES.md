# Core Domain & Mathematical Engines Documentation

## 1. Split Engine (`src/core/splitEngine.ts`)

The Split Engine computes the exact dollar amount assigned to each traveler for any given expense, guaranteeing zero floating-point remainder errors.

### Split Modes:

#### A. Equal Split
Divides the total amount equally among selected members $N$, with remainder cents distributed deterministically to the first $R$ members:
$$\text{Base Share} = \left\lfloor \frac{\text{Amount} \times 100}{N} \right\rfloor / 100$$
$$\text{Remainder Cents} = (\text{Amount} \times 100) \pmod N$$

#### B. Exact Split
Assigns exact custom currency amounts per person with total verification:
$$\text{Total Allocated} = \sum_{i=1}^N \text{CustomSplit}_i$$

#### C. Percentage Split
Calculates shares based on percentage values (must sum to 100%):
$$\text{Share}_i = \text{round}\left(\frac{\text{Amount} \times \text{Percentage}_i}{100}\right)$$

#### D. Weighted Shares Split
Calculates shares proportionally based on weights (e.g. 1x for adult, 0.5x for child, 2x for couple):
$$\text{Share}_i = \text{round}\left(\frac{\text{Amount} \times \text{Weight}_i}{\sum \text{Weight}}\right)$$

#### E. Itemized Receipt Split with Proportional Tax & Tip
1. Calculates each member's dish subtotal:
   $$\text{Subtotal}_i = \sum_{d \in \text{Dishes}_i} \frac{\text{Price}_d}{|\text{Partakers}_d|}$$
2. Computes the member's proportion of the food bill:
   $$P_i = \frac{\text{Subtotal}_i}{\sum \text{Subtotals}}$$
3. Apportions tax and tip proportionally:
   $$\text{Final Share}_i = \text{Subtotal}_i + (P_i \times \text{Tax}) + (P_i \times \text{Tip})$$

---

## 2. Debt Optimization Engine (`src/core/debtEngine.ts`)

### Net Balance Calculation:
$$\text{Balance}_M = \text{TotalPaid}_M - \text{TotalConsumed}_M + \text{SettlementsSent}_M - \text{SettlementsReceived}_M$$
- $\text{Balance} > 0$: Traveler is owed money (Creditor).
- $\text{Balance} < 0$: Traveler owes money (Debtor).

### Bipartite Greedy Debt Minimization Algorithm:
1. Divide members into Debtors ($D$) sorted descending by $|debt|$ and Creditors ($C$) sorted descending by credit.
2. Pair the largest debtor $D_{\max}$ with the largest creditor $C_{\max}$.
3. Transaction amount: $T = \min(|D_{\max}|, C_{\max})$.
4. Create transfer: $D_{\max} \xrightarrow{T} C_{\max}$.
5. Subtract $T$ from both balances.
6. Repeat until all balances reach $\$0.00$.
*Result*: Guarantees maximum $N-1$ transactions instead of $N^2$ transfers.

---

## 3. Analytics Engine (`src/core/analyticsEngine.ts`)

Computes deep individual spending metrics:
- **`totalPaid`**: Cash paid upfront by this traveler across all expenses.
- **`totalConsumed`**: Sum of this traveler's consumed portions across all shared meals, stays, transit, and personal items.
- **`categoryBreakdown`**: True consumption classified into 8 travel categories (`food`, `transport`, `lodging`, `activities`, `groceries`, `shopping`, `emergency`, `general`).
- **`ledger`**: Chronological item-by-item breakdown of personal charges.
