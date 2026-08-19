# Role-Based Access Control (RBAC) & Security Documentation

## 1. Role Hierarchy

TravelSplit implements an explicit 3-tier Role-Based Access Control (RBAC) model per trip:

```
              ┌─────────────────────────────┐
              │    1. Trip Owner (Admin)    │
              │  - Complete Administration  │
              └──────────────┬──────────────┘
                             │
              ┌──────────────┴──────────────┐
              │  2. Member / Editor (Writer)│
              │  - Expense & Settle Logging │
              └──────────────┬──────────────┘
                             │
              ┌──────────────┴──────────────┐
              │   3. Guest / Viewer (Reader)│
              │  - Read-Only Personal Lens  │
              └─────────────────────────────┘
```

---

## 2. Permissions Matrix

| Feature / Capability | Trip Owner | Member / Editor | Guest / Viewer |
| :--- | :---: | :---: | :---: |
| **View Dashboard, Expenses & Balances** | <span style="color:green">✔ Allowed</span> | <span style="color:green">✔ Allowed</span> | <span style="color:green">✔ Allowed</span> |
| **View "My Spend" Personal Analytics** | <span style="color:green">✔ Allowed</span> | <span style="color:green">✔ Allowed</span> | <span style="color:green">✔ Allowed</span> |
| **Add New Expenses** | <span style="color:green">✔ Allowed</span> | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> |
| **Edit Own Expenses** | <span style="color:green">✔ Allowed</span> | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> |
| **Edit Other Members' Expenses** | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> | <span style="color:red">✖ Denied</span> |
| **Delete Own Expenses** | <span style="color:green">✔ Allowed</span> | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> |
| **Delete Other Members' Expenses** | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> | <span style="color:red">✖ Denied</span> |
| **Record Settle-Up Payments** | <span style="color:green">✔ Allowed</span> | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> |
| **Add / Remove Trip Members** | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> | <span style="color:red">✖ Denied</span> |
| **Modify Member Roles (Promote/Demote)** | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> | <span style="color:red">✖ Denied</span> |
| **Edit Trip Settings & Base Currency** | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> | <span style="color:red">✖ Denied</span> |
| **Delete or Archive Entire Trip** | <span style="color:green">✔ Allowed</span> | <span style="color:red">✖ Denied</span> | <span style="color:red">✖ Denied</span> |

---

## 3. Enforcement Layers

1. **Presentation Layer (UI Guards)**:
   - UI buttons (`+ Add Expense`, `Edit`, `Delete`, `Record Settle`) are dynamically disabled or hidden with tooltips when the active role lacks permissions.
2. **Core Domain Rules (`src/core/rbacEngine.ts`)**:
   - Centralized validation functions (`canManageTrip`, `canEditExpense`, `canDeleteExpense`, `canAddExpense`, `canRecordSettlement`).
3. **Backend API Verification**:
   - Server endpoints reject unauthorized modifications with HTTP 403 Forbidden.
